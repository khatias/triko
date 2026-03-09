import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { createRouteSupabase } from "@/utils/supabase/route";
import { safeJson, json, type ApiResp } from "@/utils/http";
import { sanitizeEmail, isValidEmail } from "@/lib/validation/auth";
import { CODES, STATUS } from "@/utils/auth/codes";

type Body = {
  email?: unknown;
  website?: unknown;
};

type SupabaseError = {
  code?: string;
  status?: number;
  message?: string;
};

type Resp = ApiResp<
  typeof CODES.PASSWORD_RESET_SENT,
  | typeof CODES.UNSUPPORTED_MEDIA_TYPE
  | typeof CODES.VALIDATION
  | typeof CODES.RATE_LIMITED
  | typeof CODES.PASSWORD_RESET_FAILED
  | typeof CODES.UNEXPECTED_ERROR
>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getLocale = (req: NextRequest): "en" | "ka" => {
  const v = req.headers.get("x-next-intl-locale");
  return v === "en" ? "en" : "ka";
};

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

export async function POST(req: NextRequest) {
  const locale = getLocale(req);
  const t = await getTranslations({ locale, namespace: "Auth" });

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

  // Honeypot: always return success (anti-bot)
  const honeypot = asString(body.website).trim();
  if (honeypot) {
    const r: Resp = {
      ok: true,
      code: CODES.PASSWORD_RESET_SENT,
      message: t("resetSentGeneric"),
    };
    const res = json(r, STATUS[CODES.PASSWORD_RESET_SENT]);
    copyCookies(baseRes, res);
    return res;
  }

  const email = sanitizeEmail(asString(body.email));

  // Validate format only (don’t reveal account existence)
  if (!isValidEmail(email)) {
    const r: Resp = {
      ok: false,
      code: CODES.VALIDATION,
      message: t("invalidEmail"),
    };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  // Build redirectTo from the request origin (works in dev + prod)
  const origin = req.headers.get("origin") ?? "";
  const redirectTo = `${origin}/${locale}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    const e = error as SupabaseError;
    const code = String(e.code ?? "");
    const status = typeof e.status === "number" ? e.status : 0;
    const msg = String(e.message ?? "").toLowerCase();

    if (
      status === 429 ||
      code === "over_email_send_rate_limit" ||
      code === "over_request_rate_limit" ||
      msg.includes("rate")
    ) {
      const r: Resp = {
        ok: false,
        code: CODES.RATE_LIMITED,
        message: t("rateLimit"),
      };
      const res = json(r, STATUS[CODES.RATE_LIMITED]);
      copyCookies(baseRes, res);
      return res;
    }

    const r: Resp = {
      ok: false,
      code: CODES.PASSWORD_RESET_FAILED,
      message: t("resetFailed"),
    };
    const res = json(r, STATUS[CODES.PASSWORD_RESET_FAILED]);
    copyCookies(baseRes, res);
    return res;
  }

  // Always success message (does not reveal if email exists)
  const r: Resp = {
    ok: true,
    code: CODES.PASSWORD_RESET_SENT,
    message: t("resetSent"),
  };
  const res = json(r, STATUS[CODES.PASSWORD_RESET_SENT]);
  copyCookies(baseRes, res);
  return res;
}
