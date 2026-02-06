// src/app/api/bog/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mustProcessEnv } from "@/utils/runtime";
import { isObject, readString, normalizeId } from "@/utils/type-guards";
type OrdersStatus = "pending_payment" | "paid" | "failed" | "cancelled";
type PaymentStatus = "redirected" | "succeeded" | "failed";

type BogEnvelope = {
  event?: unknown;
  request_time?: unknown;
  zoned_request_time?: unknown;
  body?: unknown;
  [k: string]: unknown;
};

type BogBody = Record<string, unknown>;

function readLowerString(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const s = readString(obj, key);
  return s ? s.toLowerCase() : null;
}

function unwrapBody(envelope: BogEnvelope): BogBody {
  const b = envelope.body;
  return isObject(b) ? (b as BogBody) : (envelope as unknown as BogBody);
}

function readOrderStatusKey(body: BogBody): string | null {
  const v = body["order_status"];
  if (typeof v === "string" && v.trim()) return v.trim().toLowerCase();
  if (isObject(v)) {
    const key = readString(v, "key");
    return key ? key.toLowerCase() : null;
  }
  return null;
}

function normalizeBogStatus(body: BogBody, envelope: BogEnvelope): string {
  const fromOrderStatusKey = readOrderStatusKey(body);
  const s =
    fromOrderStatusKey ||
    readLowerString(body, "payment_status") ||
    readLowerString(body, "status") ||
    (typeof envelope.event === "string"
      ? envelope.event.toLowerCase().trim()
      : null) ||
    "unknown";

  return s.toLowerCase().trim();
}

function mapToOrdersStatus(bogStatus: string): OrdersStatus {
  if (
    bogStatus.includes("paid") ||
    bogStatus.includes("success") ||
    bogStatus.includes("approved") ||
    bogStatus.includes("completed") ||
    bogStatus.includes("succeed")
  )
    return "paid";

  if (
    bogStatus.includes("fail") ||
    bogStatus.includes("declined") ||
    bogStatus.includes("rejected")
  )
    return "failed";

  if (
    bogStatus.includes("cancel") ||
    bogStatus.includes("canceled") ||
    bogStatus.includes("cancelled") ||
    bogStatus.includes("refund") ||
    bogStatus.includes("refunded")
  )
    return "cancelled";

  return "pending_payment";
}

function mapToPaymentStatus(os: OrdersStatus): PaymentStatus {
  if (os === "paid") return "succeeded";
  if (os === "failed" || os === "cancelled") return "failed";
  return "redirected";
}

function nowIso(): string {
  return new Date().toISOString();
}

function getSupabaseAdmin() {
  const url = mustProcessEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = mustProcessEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function verifyOptionalSharedSecret(req: Request) {
  const expected = process.env.BOG_CALLBACK_SECRET;
  if (!expected) return;

  const got =
    req.headers.get("x-callback-secret") ||
    req.headers.get("x-bog-callback-secret") ||
    req.headers.get("authorization") ||
    "";

  const token = got.toLowerCase().startsWith("bearer ")
    ? got.slice(7).trim()
    : got.trim();

  if (!token || token !== expected) throw new Error("Unauthorized callback");
}

type MatchedBy = "external_order_id" | "bog_order_id";

async function findOrderId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  externalOrderId: string | null,
  bogOrderId: string | null,
): Promise<{ orderId: string | null; matchedBy: MatchedBy | null }> {
  if (externalOrderId)
    return { orderId: externalOrderId, matchedBy: "external_order_id" };

  if (bogOrderId) {
    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("bog_order_id", bogOrderId)
      .limit(1);

    if (error) throw error;
    const id = (data?.[0]?.id ?? null) as string | null;
    if (id) return { orderId: id, matchedBy: "bog_order_id" };
  }

  return { orderId: null, matchedBy: null };
}

function readPaymentDetail(body: BogBody): Record<string, unknown> | null {
  const pd = body["payment_detail"];
  return isObject(pd) ? pd : null;
}

function readPaymentTransactionId(body: BogBody): string | null {
  const pd = readPaymentDetail(body);
  if (!pd) return null;
  return normalizeId(pd["transaction_id"]);
}

function readPgTrxId(body: BogBody): string | null {
  const pd = readPaymentDetail(body);
  if (!pd) return null;
  return readString(pd, "pg_trx_id");
}

function readProviderRedirectUrl(body: BogBody): string | null {
  const direct =
    (typeof body["redirect_url"] === "string" &&
      (body["redirect_url"] as string).trim()) ||
    (typeof body["provider_redirect_url"] === "string" &&
      (body["provider_redirect_url"] as string).trim()) ||
    null;

  return direct || null;
}

export async function POST(req: Request) {
  try {
    verifyOptionalSharedSecret(req);

    const envelopeUnknown = (await req.json()) as unknown;
    if (!isObject(envelopeUnknown)) {
      console.error("[BOG] callback invalid json envelope");
      return NextResponse.json(
        { ok: false, error: "Invalid envelope" },
        { status: 200 },
      );
    }

    const envelope = envelopeUnknown as BogEnvelope;
    const body = unwrapBody(envelope);

    const externalOrderId = normalizeId(body["external_order_id"]);
    const bogOrderId = normalizeId(body["order_id"]);

    const bogStatus = normalizeBogStatus(body, envelope);
    const mappedOrdersStatus = mapToOrdersStatus(bogStatus);
    const paymentStatus = mapToPaymentStatus(mappedOrdersStatus);


    const providerPaymentId =
      normalizeId(body["payment_id"]) ||
      normalizeId(body["provider_payment_id"]) ||
      readPaymentTransactionId(body) ||
      null;

    const pgTrxId = readPgTrxId(body); 
    const providerRedirectUrl = readProviderRedirectUrl(body);

    const supabase = getSupabaseAdmin();

    const found = await findOrderId(supabase, externalOrderId, bogOrderId);
    if (!found.orderId) {
      console.error("[BOG] callback could not match order", {
        externalOrderId,
        bogOrderId,
        bogStatus,
      });
      return NextResponse.json(
        { ok: false, error: "Order not found for callback" },
        { status: 200 },
      );
    }

    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id,total,currency,status,bog_order_id,bog_payment_url,bog_payment_id,paid_at",
      )
      .eq("id", found.orderId)
      .limit(1);

    if (orderErr) throw orderErr;

    const order = orderRow?.[0] as
      | {
          id: string;
          total: number;
          currency: string;
          status: OrdersStatus;
          bog_order_id: string | null;
          bog_payment_url: string | null;
          bog_payment_id: string | null;
          paid_at: string | null;
        }
      | undefined;

    if (!order) {
      console.error("[BOG] order missing after match", {
        orderId: found.orderId,
      });
      return NextResponse.json(
        { ok: false, error: "Order missing after match" },
        { status: 200 },
      );
    }

    // Never downgrade a paid order
    const finalOrdersStatus: OrdersStatus =
      order.status === "paid" ? "paid" : mappedOrdersStatus;

    const ordersPatch: Record<string, unknown> = {
      status: finalOrdersStatus,
      updated_at: nowIso(),
      bog_status: bogStatus,
      bog_callback_payload: envelope, 
    };

   
    if (bogOrderId && !order.bog_order_id)
      ordersPatch.bog_order_id = bogOrderId;
    if (providerRedirectUrl && !order.bog_payment_url)
      ordersPatch.bog_payment_url = providerRedirectUrl;
    if (providerPaymentId && !order.bog_payment_id)
      ordersPatch.bog_payment_id = providerPaymentId;

    if (pgTrxId) {

    }

    if (finalOrdersStatus === "paid" && !order.paid_at) {
      ordersPatch.paid_at = nowIso();
    }

    const { data: updatedOrders, error: updErr } = await supabase
      .from("orders")
      .update(ordersPatch)
      .eq("id", order.id)
      .select("id,status");

    if (updErr) throw updErr;

    // ---- order_payments (idempotent) ----
    const basePaymentRow: Record<string, unknown> = {
      order_id: order.id,
      provider: "bog",
      status: paymentStatus,
      amount: order.total,
      currency: order.currency,
      updated_at: nowIso(),
    };

    if (providerPaymentId)
      basePaymentRow.provider_payment_id = providerPaymentId;
    if (providerRedirectUrl)
      basePaymentRow.provider_redirect_url = providerRedirectUrl;
    if (bogOrderId) basePaymentRow.provider_order_id = bogOrderId;

    // Prefer upsert by BOG order id
    if (bogOrderId) {
      const { error } = await supabase
        .from("order_payments")
        .upsert(basePaymentRow, { onConflict: "provider,provider_order_id" });

      if (error)
        console.error(
          "[BOG] order_payments upsert (provider_order_id) error",
          error,
        );
    } else if (providerPaymentId) {
      const { error } = await supabase
        .from("order_payments")
        .upsert(basePaymentRow, { onConflict: "provider,provider_payment_id" });

      if (error)
        console.error(
          "[BOG] order_payments upsert (provider_payment_id) error",
          error,
        );
    } else {
      // Fallback: update the most recent payment row, to avoid inserting duplicates
      const { data: lastPay, error: lastErr } = await supabase
        .from("order_payments")
        .select("id")
        .eq("order_id", order.id)
        .eq("provider", "bog")
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastErr) {
        console.error("[BOG] order_payments latest fetch error", lastErr);
      } else {
        const lastId = (lastPay?.[0]?.id ?? null) as string | null;
        if (lastId) {
          const patch: Record<string, unknown> = {
            status: paymentStatus,
            updated_at: nowIso(),
          };
          if (providerRedirectUrl)
            patch.provider_redirect_url = providerRedirectUrl;
          if (providerPaymentId) patch.provider_payment_id = providerPaymentId;
          if (bogOrderId) patch.provider_order_id = bogOrderId;

          const { error } = await supabase
            .from("order_payments")
            .update(patch)
            .eq("id", lastId);

          if (error)
            console.error("[BOG] order_payments update latest error", error);
        } else {
          // No row exists: insert minimal
          const { error } = await supabase.from("order_payments").insert({
            order_id: order.id,
            provider: "bog",
            status: paymentStatus,
            amount: order.total,
            currency: order.currency,
            provider_payment_id: providerPaymentId,
            provider_redirect_url: providerRedirectUrl,
            provider_order_id: bogOrderId,
          });

          if (error)
            console.error("[BOG] order_payments insert minimal error", error);
        }
      }
    }

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        matchedBy: found.matchedBy,
        externalOrderId,
        bogOrderId,
        providerPaymentId,
        pgTrxId,
        bogStatus,
        mappedOrdersStatus,
        finalOrdersStatus,
        updatedCount: updatedOrders?.length ?? 0,
      },
      { status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[BOG] callback exception", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
