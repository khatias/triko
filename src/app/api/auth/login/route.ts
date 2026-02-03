// app/api/auth/login/route.ts
import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { createRouteSupabase } from "@/utils/supabase/route";
import { safeJson, json, type ApiResp } from "@/utils/http";
import { sanitizeEmail, isValidEmail } from "@/lib/validation/auth";
import { CODES, STATUS } from "@/utils/auth/codes";

type Body = {
  email?: unknown;
  password?: unknown;
  website?: unknown;
};

type SupabaseError = {
  code?: string;
  status?: number;
  message?: string;
};

type Resp = ApiResp<
  typeof CODES.SIGNIN_OK,
  | typeof CODES.UNSUPPORTED_MEDIA_TYPE
  | typeof CODES.VALIDATION
  | typeof CODES.INVALID_CREDENTIALS
  | typeof CODES.RATE_LIMITED
  | typeof CODES.UNEXPECTED_ERROR
>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CART_COOKIE = "cart_token";
const CURRENCY = "GEL";

function getLocale(req: NextRequest): "en" | "ka" {
  const v = req.headers.get("x-next-intl-locale");
  return v === "en" ? "en" : "ka";
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export async function POST(req: NextRequest) {
  const t = await getTranslations({
    locale: getLocale(req),
    namespace: "Auth",
  });

  const { supabase, baseRes, copyCookies } = createRouteSupabase(req);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const r: Resp = {
      ok: false,
      code: CODES.UNSUPPORTED_MEDIA_TYPE,
      message: t("unsupported"),
    };
    const res = json(r, STATUS[CODES.UNSUPPORTED_MEDIA_TYPE]);
    copyCookies(baseRes, res);
    return res;
  }

  const body = await safeJson<Body>(req);
  if (!body) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("unknown") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  const honeypot = asString(body.website).trim();
  if (honeypot) {
    const r: Resp = { ok: true, code: CODES.SIGNIN_OK, message: t("loginSuccess") };
    const res = json(r, STATUS[CODES.SIGNIN_OK]);
    copyCookies(baseRes, res);
    return res;
  }

  const email = sanitizeEmail(asString(body.email));
  const password = asString(body.password);

  if (!isValidEmail(email)) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("invalidEmail") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  if (!password) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("passwordRequired") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  if (password.length > 72) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("passwordTooLong") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const e = error as SupabaseError;
    const code = String(e.code ?? "");
    const status = typeof e.status === "number" ? e.status : 0;

    if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
      const r: Resp = { ok: false, code: CODES.RATE_LIMITED, message: t("rateLimit") };
      const res = json(r, STATUS[CODES.RATE_LIMITED]);
      copyCookies(baseRes, res);
      return res;
    }

    if (status >= 500) {
      const r: Resp = { ok: false, code: CODES.UNEXPECTED_ERROR, message: t("supabase") };
      const res = json(r, STATUS[CODES.UNEXPECTED_ERROR]);
      copyCookies(baseRes, res);
      return res;
    }

    const r: Resp = { ok: false, code: CODES.INVALID_CREDENTIALS, message: t("invalidCredentials") };
    const res = json(r, STATUS[CODES.INVALID_CREDENTIALS]);
    copyCookies(baseRes, res);
    return res;
  }

  if (!data?.session) {
    const r: Resp = { ok: false, code: CODES.UNEXPECTED_ERROR, message: t("unknown") };
    const res = json(r, STATUS[CODES.UNEXPECTED_ERROR]);
    copyCookies(baseRes, res);
    return res;
  }

  // ✅ Important: make sure subsequent RPCs are authenticated in THIS request
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  // ✅ Merge guest cart into user cart
  const token = req.cookies.get(CART_COOKIE)?.value ?? null;
  let merged = false;

  if (token) {
    const { data: mergeData, error: mergeError } = await supabase.rpc(
      "cart_merge_guest_into_user_v2",
      {
        // carts.cart_token is uuid, cookie value is a uuid string
        p_cart_token: token,
        p_currency: CURRENCY,
      },
    );

    if (mergeError) {
      console.error("cart merge failed:", mergeError);
    } else {
      // if your function returns uuid, mergeData will be that uuid
      merged = true;
      console.log("cart merge ok:", mergeData);
    }
  }

  const r: Resp = { ok: true, code: CODES.SIGNIN_OK, message: t("loginSuccess"), email };
  const res = json(r, STATUS[CODES.SIGNIN_OK]);
  copyCookies(baseRes, res);

  // ✅ Clear cookie only if merge truly succeeded
 if (token && merged) {
  res.cookies.set(CART_COOKIE, "", { path: "/", maxAge: 0 });
}


  return res;
}
