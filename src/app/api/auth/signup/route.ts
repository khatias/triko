// src/app/api/auth/signup/route.ts
import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { createRouteSupabase } from "@/utils/supabase/route";
import { safeJson, json, type ApiResp } from "@/utils/http";
import { sanitizeEmail, isValidEmail, isValidPassword } from "@/lib/validation/auth";
import { CODES, STATUS } from "@/utils/auth/codes";

type Body = {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
  website?: unknown; // honeypot
};

type SupabaseError = {
  code?: string;
  status?: number;
  message?: string;
};

type Resp = ApiResp<
  typeof CODES.SIGNUP_VERIFY_EMAIL_SENT,
  | typeof CODES.UNSUPPORTED_MEDIA_TYPE
  | typeof CODES.VALIDATION
  | typeof CODES.EMAIL_ALREADY_REGISTERED
  | typeof CODES.RATE_LIMITED
  | typeof CODES.SUPABASE_SIGNUP_ERROR
  | typeof CODES.UNEXPECTED_ERROR
>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const r: Resp = {
      ok: false,
      code: CODES.VALIDATION,
      message: t("unknown"),
    };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  // Honeypot (anti-bot)
  const honeypot = asString(body.website).trim();
  if (honeypot) {
    const r: Resp = {
      ok: true,
      code: CODES.SIGNUP_VERIFY_EMAIL_SENT,
      message: t("signupSuccessGeneric"),
    };
    const res = json(r, STATUS[CODES.SIGNUP_VERIFY_EMAIL_SENT]);
    copyCookies(baseRes, res);
    return res;
  }

  const email = sanitizeEmail(asString(body.email));
  const password = asString(body.password);
  const full_name = asString(body.full_name).trim();

  if (!isValidEmail(email)) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("invalidEmail") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  if (!isValidPassword(password)) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("invalidPassword") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  if (full_name.length < 2 || full_name.length > 100) {
    const r: Resp = { ok: false, code: CODES.VALIDATION, message: t("invalidFullName") };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      // If you want a fixed confirmation redirect, uncomment and whitelist it in Supabase Redirect URLs:
      // emailRedirectTo: `${req.headers.get("origin") ?? ""}/${getLocale(req)}/auth/confirm`,
    },
  });

  if (error) {
    const e = error as SupabaseError;
    const code = String(e.code ?? "");
    const status = typeof e.status === "number" ? e.status : 0;
    const msg = String(e.message ?? "").toLowerCase();

    // Rate limits (email + request)
    if (
      status === 429 ||
      code === "over_email_send_rate_limit" ||
      code === "over_request_rate_limit"
    ) {
      const r: Resp = { ok: false, code: CODES.RATE_LIMITED, message: t("rateLimit") };
      const res = json(r, STATUS[CODES.RATE_LIMITED]);
      copyCookies(baseRes, res);
      return res;
    }

    // Already registered (handle variants)
    const already =
      status === 409 ||
      code === "user_already_exists" ||
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered");

    if (already) {
      const r: Resp = { ok: false, code: CODES.EMAIL_ALREADY_REGISTERED, message: t("emailInUse") };
      const res = json(r, STATUS[CODES.EMAIL_ALREADY_REGISTERED]);
      copyCookies(baseRes, res);
      return res;
    }

    const r: Resp = { ok: false, code: CODES.SUPABASE_SIGNUP_ERROR, message: t("supabase") };
    const res = json(r, STATUS[CODES.SUPABASE_SIGNUP_ERROR]);
    copyCookies(baseRes, res);
    return res;
  }

  // Supabase can "succeed" but indicate an existing email (anti-enumeration behavior)
  const identities = data?.user?.identities ?? [];
  const returnedEmail = String(data?.user?.email ?? "").toLowerCase();
  const looksExisting = identities.length === 0 && returnedEmail === email.toLowerCase();

  if (looksExisting) {
    const r: Resp = {
      ok: false,
      code: CODES.EMAIL_ALREADY_REGISTERED,
      message: t("emailInUse"),
    };
    const res = json(r, STATUS[CODES.EMAIL_ALREADY_REGISTERED]);
    copyCookies(baseRes, res);
    return res;
  }

  if (!data?.user) {
    const r: Resp = { ok: false, code: CODES.UNEXPECTED_ERROR, message: t("unknown") };
    const res = json(r, STATUS[CODES.UNEXPECTED_ERROR]);
    copyCookies(baseRes, res);
    return res;
  }

  const r: Resp = {
    ok: true,
    code: CODES.SIGNUP_VERIFY_EMAIL_SENT,
    message: t("signupSuccess", { email }),
    email,
  };

  const res = json(r, STATUS[CODES.SIGNUP_VERIFY_EMAIL_SENT]);
  copyCookies(baseRes, res);
  return res;
}
