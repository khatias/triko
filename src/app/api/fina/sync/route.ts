import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mustProcessEnv } from "@/utils/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OutboxRow = {
  id: number;
  order_id: string;
  attempts: number;
};

type OrderRow = {
  id: string;
  currency: string;
  total: string | number;
  paid_at: string | null;
  fina_doc_id: number | null;
};

type OrderItemRow = {
  fina_id: number | null;
  quantity: number;
  unit_price: string | number;
  product_name: string | null;
};

type FinaResponse = { id?: number; ex?: string | null };

function toNumberStrict(v: unknown, name: string): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  throw new Error(`Invalid number for ${name}`);
}

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env ${name}`);
  return v.trim();
}

function getSupabaseAdmin() {
  const url = mustProcessEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = mustProcessEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function boolHeader(req: Request, name: string): boolean {
  const v = (req.headers.get(name) ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function envBool(name: string): boolean {
  return (process.env[name] ?? "").trim().toLowerCase() === "true";
}

export async function POST(req: Request) {
  try {
    const expected = process.env.FINA_SYNC_SECRET;
    if (expected) {
      const got = req.headers.get("x-sync-secret") ?? "";
      if (got !== expected) return NextResponse.json({ ok: false }, { status: 401 });
    }

    const dryRun = boolHeader(req, "x-dry-run");
    const supabase = getSupabaseAdmin();

    const { data: jobs, error: jobsErr } = await supabase
      .from("fina_outbox")
      .select("id,order_id,attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10)
      .returns<OutboxRow[]>();

    if (jobsErr) throw jobsErr;
    if (!jobs || jobs.length === 0) return NextResponse.json({ ok: true, processed: 0, dryRun });

    // Kill switch: real run requires FINA_ENABLED=true
    if (!dryRun && !envBool("FINA_ENABLED")) {
      return NextResponse.json({ ok: false, error: "FINA_DISABLED" }, { status: 400 });
    }

    // Only required for REAL run
    let baseUrl = "";
    let token = "";
    let storeId = 0;
    let finaUserId = 0;
    let defaultCustomerId = 0;

    if (!dryRun) {
      baseUrl = mustEnv("FINA_BASE_URL").replace(/\/+$/, "");
      token = mustEnv("FINA_TOKEN");
      storeId = Number(mustEnv("FINA_STORE_ID"));
      finaUserId = Number(mustEnv("FINA_USER_ID"));
      defaultCustomerId = Number(mustEnv("FINA_DEFAULT_CUSTOMER_ID"));
      if (!Number.isFinite(storeId) || !Number.isFinite(finaUserId) || !Number.isFinite(defaultCustomerId)) {
        throw new Error("FINA ids must be numbers");
      }
    }

    let processed = 0;

    for (const job of jobs) {
      await supabase
        .from("fina_outbox")
        .update({ status: "sending", last_attempt_at: new Date().toISOString() })
        .eq("id", job.id);

      try {
        const { data: ord, error: ordErr } = await supabase
          .from("orders")
          .select("id,currency,total,paid_at,fina_doc_id")
          .eq("id", job.order_id)
          .single()
          .returns<OrderRow>();

        if (ordErr) throw ordErr;
        if (!ord) throw new Error("Order not found");

        // idempotency
        if (ord.fina_doc_id) {
          await supabase.from("fina_outbox").update({ status: "sent" }).eq("id", job.id);
          processed += 1;
          continue;
        }

        if (!ord.paid_at) throw new Error("Order not paid yet");

        const { data: items, error: itemsErr } = await supabase
          .from("order_items")
          .select("fina_id,quantity,unit_price,product_name")
          .eq("order_id", ord.id)
          .returns<OrderItemRow[]>();

        if (itemsErr) throw itemsErr;
        if (!items || items.length === 0) throw new Error("Order items not found");

        const products = items.map((it) => {
          if (!it.fina_id) throw new Error("Missing fina_id in order_items");
          return {
            id: it.fina_id,
            sub_id: 0,
            quantity: it.quantity,
            price: toNumberStrict(it.unit_price, "unit_price"),
          };
        });

        const amount = toNumberStrict(ord.total, "order.total");

        const payload = {
          id: 0,
          date: ord.paid_at,
          num_pfx: "TRIKO",
          num: 0,
          purpose: `Triko order ${ord.id}`,
          amount,
          currency: ord.currency,
          rate: 1.0,
          store: storeId,
          user: finaUserId,
          staff: 0,
          project: 0,
          customer: defaultCustomerId,
          is_vat: true,
          make_entry: false, // ✅ safest for first real test
          pay_type: 1,
          price_type: 3,
          w_type: 3,
          t_type: 1,
          t_payer: 2,
          w_cost: 0,
          foreign: false,
          comment: "Online sale",
          overlap_type: 0,
          overlap_amount: 0,
          add_fields: [],
          products,
          services: [],
        };

        // DRY RUN
        if (dryRun) {
          await supabase
            .from("fina_outbox")
            .update({
              status: "pending",
              last_error: `DRY_RUN ok products=${products.length} amount=${amount}`,
            })
            .eq("id", job.id);

          processed += 1;
          continue;
        }

        // REAL RUN
        const resp = await fetch(`${baseUrl}/api/operation/saveDocProductOut`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const finaJson = (await resp.json()) as unknown;
        if (!resp.ok) throw new Error(`Fina HTTP ${resp.status}: ${JSON.stringify(finaJson)}`);

        const fina = finaJson as FinaResponse;
        if (fina.ex) throw new Error(`Fina ex: ${fina.ex}`);
        if (!fina.id) throw new Error(`Fina missing id: ${JSON.stringify(finaJson)}`);

        const finaDocId = Number(fina.id);

        const { error: updOrderErr } = await supabase
          .from("orders")
          .update({
            fina_doc_id: finaDocId,
            fina_synced_at: new Date().toISOString(),
            fina_sync_error: null,
          })
          .eq("id", ord.id);

        if (updOrderErr) throw updOrderErr;

        await supabase
          .from("fina_outbox")
          .update({ status: "sent", last_error: null })
          .eq("id", job.id);

        processed += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        const attempts = job.attempts + 1;

        await supabase
          .from("fina_outbox")
          .update({
            status: attempts >= 10 ? "failed" : "pending",
            attempts,
            last_error: msg,
          })
          .eq("id", job.id);

        await supabase.from("orders").update({ fina_sync_error: msg }).eq("id", job.order_id);
      }
    }

    return NextResponse.json({ ok: true, processed, dryRun });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}