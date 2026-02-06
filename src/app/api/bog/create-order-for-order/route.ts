// src/app/api/bog/create-order-for-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

import { createClient } from "@/utils/supabase/server";
import { getBogAccessToken } from "@/lib/payments/bog/auth";
import type {
  BogBasketItem,
  BogCreateOrderApiResponse,
  BogCreateOrderPayload,
  BogCreateOrderResponse,
} from "@/types/bog";

import {
  localeToLang,
  normalizeLocale,
  toNumber,
  toTetri,
  fromTetri,
  sumBasketTetri,
  asBogCurrency,
  isValidHttpUrl,
  isObject,
  readString,
  readNumberStrict,
  readBoolean,
} from "@/utils/type-guards";

import { isDev, getPublicSiteUrl, getCallbackUrl } from "@/utils/runtime";
import type { DbOrderItem } from "@/types/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userSafeErrorMessage(): string {
  return "Payment initialization failed. Please try again.";
}

function mustHttpsBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const u = new URL(trimmed);
  if (u.protocol !== "https:") throw new Error("[BOG] base url must be https");
  return u.toString().replace(/\/$/, "");
}

type BogPrepareOkAlready = {
  ok: true;
  already: true;
  bog_order_id: string;
  redirect_url: string;
  details_url?: string;
  public_status_token: string;
};

type BogPrepareOkNew = {
  ok: true;
  already: false;
  idempotency_key: string;
  currency: string;
  total: number;
  public_status_token: string;
};

type BogPrepareFail = {
  ok: false;
  status?: number;
  message?: string;
};

type BogPrepareResult = BogPrepareOkAlready | BogPrepareOkNew | BogPrepareFail;

type BogFinalizeOk = {
  ok: true;
  bog_order_id?: string;
  redirect_url?: string;
  details_url?: string;
};

type BogFinalizeFail = {
  ok: false;
  status?: number;
  message?: string;
};

type BogFinalizeResult = BogFinalizeOk | BogFinalizeFail;

function parseBogPrepareResult(raw: unknown): BogPrepareResult {
  if (!isObject(raw)) return { ok: false, status: 500, message: "Invalid RPC response" };

  const ok = readBoolean(raw, "ok");
  if (ok !== true) {
    return {
      ok: false,
      status: readNumberStrict(raw, "status") ?? 500,
      message: readString(raw, "message") ?? "Prepare failed",
    };
  }

  const already = readBoolean(raw, "already");
  if (already === true) {
    const bog_order_id = readString(raw, "bog_order_id");
    const redirect_url = readString(raw, "redirect_url");
    const details_url = readString(raw, "details_url") ?? undefined;
    const public_status_token = readString(raw, "public_status_token");

    if (!bog_order_id || !redirect_url || !public_status_token) {
      return { ok: false, status: 500, message: "Invalid already response" };
    }

    return { ok: true, already: true, bog_order_id, redirect_url, details_url, public_status_token };
  }

  const idempotency_key = readString(raw, "idempotency_key");
  const currency = readString(raw, "currency");
  const total = readNumberStrict(raw, "total");
  const public_status_token = readString(raw, "public_status_token");

  if (!idempotency_key || !currency || total === null || !public_status_token) {
    return { ok: false, status: 500, message: "Invalid prepare response" };
  }

  return { ok: true, already: false, idempotency_key, currency, total, public_status_token };
}

function parseBogFinalizeResult(raw: unknown): BogFinalizeResult {
  if (!isObject(raw)) return { ok: false, status: 500, message: "Invalid RPC response" };

  const ok = readBoolean(raw, "ok");
  if (ok !== true) {
    return {
      ok: false,
      status: readNumberStrict(raw, "status") ?? 500,
      message: readString(raw, "message") ?? "Finalize failed",
    };
  }

  return {
    ok: true,
    bog_order_id: readString(raw, "bog_order_id") ?? undefined,
    redirect_url: readString(raw, "redirect_url") ?? undefined,
    details_url: readString(raw, "details_url") ?? undefined,
  };
}

function getBogHref(bog: BogCreateOrderResponse, rel: "redirect" | "details"): string {
  const href = bog._links?.[rel]?.href;
  if (typeof href !== "string" || href.length === 0) {
    throw new Error(`[BOG] Missing _links.${rel}.href`);
  }
  return href;
}

function buildReturnUrl(args: {
  publicSiteUrl: string;
  localeSeg: string;
  orderId: string;
  status: "success" | "fail";
  publicStatusToken: string;
}): string {
  const u = new URL(`/${args.localeSeg}/payment/return/${args.orderId}`, args.publicSiteUrl);
  u.searchParams.set("status", args.status);
  u.searchParams.set("token", args.publicStatusToken);
  return u.toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;

    if (!isObject(body)) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: "Invalid body" },
        { status: 400 },
      );
    }

    const orderId = readString(body, "orderId");
    const locale = readString(body, "locale") ?? undefined;

    if (!orderId) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: "Missing orderId" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: prepRaw, error: prepErr } = await supabase.rpc("bog_prepare_create_order", {
      p_order_id: orderId,
    });

    if (prepErr) {
      console.error("[BOG] prepare rpc failed", prepErr);
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: userSafeErrorMessage() },
        { status: 500 },
      );
    }

    const prep = parseBogPrepareResult(prepRaw);

    if (!prep.ok) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: prep.message ?? userSafeErrorMessage() },
        { status: prep.status ?? 500 },
      );
    }

    if (prep.already === true) {
      return NextResponse.json<BogCreateOrderApiResponse>({
        ok: true,
        bogOrderId: prep.bog_order_id,
        redirectUrl: prep.redirect_url,
        detailsUrl: prep.details_url ?? "",
      });
    }

    const idempotencyKey = prep.idempotency_key;
    const currency = prep.currency;
    const orderTotal = prep.total;
    const publicStatusToken = prep.public_status_token;

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("fina_id,quantity,unit_price,product_name")
      .eq("order_id", orderId)
      .overrideTypes<DbOrderItem[], { merge: false }>();

    if (itemsErr || !items || items.length === 0) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: "Order items not found" },
        { status: 400 },
      );
    }

    const publicSiteUrl = getPublicSiteUrl();
    const callbackUrl = getCallbackUrl(publicSiteUrl);

    if (!callbackUrl.startsWith("https://")) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: "BOG callback_url must be HTTPS" },
        { status: 500 },
      );
    }

    const acceptLanguage = localeToLang(locale);
    const localeSeg = normalizeLocale(locale ?? "ka");

    const successUrl = buildReturnUrl({
      publicSiteUrl,
      localeSeg,
      orderId,
      status: "success",
      publicStatusToken,
    });

    const failUrl = buildReturnUrl({
      publicSiteUrl,
      localeSeg,
      orderId,
      status: "fail",
      publicStatusToken,
    });

    const basket: BogBasketItem[] = items.map((it) => ({
      product_id: String(it.fina_id),
      quantity: it.quantity,
      unit_price: toNumber(it.unit_price),
      description: it.product_name ?? undefined,
    }));

    const totalTetri = toTetri(orderTotal);
    const basketTetri = sumBasketTetri(basket);

    if (basketTetri !== totalTetri) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        {
          ok: false,
          message: `Basket (${fromTetri(basketTetri)}) != total (${fromTetri(totalTetri)})`,
        },
        { status: 400 },
      );
    }

    const totalAmount = fromTetri(basketTetri);

    const payload: BogCreateOrderPayload = {
      callback_url: callbackUrl,
      external_order_id: orderId,
      purchase_units: {
        currency: asBogCurrency(currency),
        total_amount: totalAmount,
        basket,
      },
      redirect_urls: { success: successUrl, fail: failUrl },
      payment_method: ["card"],
    };

    const baseRaw = process.env.BOG_PAYMENTS_BASE_URL ?? "https://api.bog.ge";
    const base = mustHttpsBaseUrl(baseRaw);
    const token = await getBogAccessToken();

    const resp = await axios.post<BogCreateOrderResponse>(
      `${base}/payments/v1/ecommerce/orders`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.access_token}`,
          "Accept-Language": acceptLanguage,
          "Idempotency-Key": idempotencyKey,
        },
        timeout: 15_000,
      },
    );

    const bog = resp.data;

    const bogOrderId = bog.id;
    if (typeof bogOrderId !== "string" || bogOrderId.length === 0) {
      throw new Error("[BOG] Missing id");
    }

    const redirectUrl = getBogHref(bog, "redirect");
    const detailsUrl = getBogHref(bog, "details");

    if (!isValidHttpUrl(redirectUrl) || !redirectUrl.startsWith("https://")) {
      throw new Error("[BOG] Invalid redirect url from provider");
    }

    const { data: finRaw, error: finErr } = await supabase.rpc("bog_finalize_create_order", {
      p_order_id: orderId,
      p_bog_order_id: bogOrderId,
      p_redirect_url: redirectUrl,
      p_details_url: detailsUrl,
      p_amount: totalAmount,
      p_currency: asBogCurrency(currency),
    });

    if (finErr) {
      console.error("[BOG] finalize rpc failed", finErr);
      return NextResponse.json<BogCreateOrderApiResponse>({
        ok: true,
        bogOrderId,
        redirectUrl,
        detailsUrl,
        raw: isDev() ? bog : undefined,
      });
    }

    const fin = parseBogFinalizeResult(finRaw);

    if (!fin.ok) {
      console.error("[BOG] finalize rpc returned fail:", fin);
      return NextResponse.json<BogCreateOrderApiResponse>({
        ok: true,
        bogOrderId,
        redirectUrl,
        detailsUrl,
        raw: isDev() ? bog : undefined,
      });
    }

    return NextResponse.json<BogCreateOrderApiResponse>({
      ok: true,
      bogOrderId: fin.bog_order_id ?? bogOrderId,
      redirectUrl: fin.redirect_url ?? redirectUrl,
      detailsUrl: fin.details_url ?? detailsUrl,
      raw: isDev() ? bog : undefined,
    });
  } catch (e) {
    console.error("[BOG] create-order-for-order fatal:", e);

    if (!isDev()) {
      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: userSafeErrorMessage() },
        { status: 500 },
      );
    }

    if (axios.isAxiosError(e)) {
      const ax = e as AxiosError<unknown>;
      const providerMsg =
        (ax.response?.data ? JSON.stringify(ax.response.data) : null) ??
        ax.message ??
        "Axios error";

      return NextResponse.json<BogCreateOrderApiResponse>(
        { ok: false, message: providerMsg },
        { status: 500 },
      );
    }

    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<BogCreateOrderApiResponse>(
      { ok: false, message: msg },
      { status: 500 },
    );
  }
}
