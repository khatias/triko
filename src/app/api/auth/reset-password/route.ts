// src/app/api/auth/reset-password/route.ts
import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";

import { createRouteSupabase } from "@/utils/supabase/route";
import { safeJson, json, type ApiResp } from "@/utils/http";
import { CODES, STATUS } from "@/utils/auth/codes";

type Body = {
  password?: unknown;
  website?: unknown; // honeypot
};

type SupabaseError = {
  code?: string;
  status?: number;
  message?: string;
};

type Resp = ApiResp<
  // success
  "PASSWORD_UPDATED",
  // error codes
  | typeof CODES.UNSUPPORTED_MEDIA_TYPE
  | typeof CODES.VALIDATION
  | "RESET_LINK_INVALID_OR_EXPIRED"
  | typeof CODES.RATE_LIMITED
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

  // Honeypot: pretend success
  const honeypot = asString(body.website).trim();
  if (honeypot) {
    const r: Resp = {
      ok: true,
      code: "PASSWORD_UPDATED",
      message: t("passwordUpdated"),
    };
    const res = json(r, 200);
    copyCookies(baseRes, res);
    return res;
  }

  const password = asString(body.password);

  // Minimal server validation (client schema enforces strong rules)
  if (!password) {
    const r: Resp = {
      ok: false,
      code: CODES.VALIDATION,
      message: t("passwordRequired"),
    };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  if (password.length > 72) {
    const r: Resp = {
      ok: false,
      code: CODES.VALIDATION,
      message: t("passwordTooLong"),
    };
    const res = json(r, STATUS[CODES.VALIDATION]);
    copyCookies(baseRes, res);
    return res;
  }

  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    const e = error as SupabaseError;
    const code = String(e.code ?? "");
    const status = typeof e.status === "number" ? e.status : 0;
    const msg = String(e.message ?? "").toLowerCase();

    // Rate limit
    if (
      status === 429 ||
      code === "over_request_rate_limit" ||
      code === "over_email_send_rate_limit" ||
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

    // ✅ Same password (new password must be different)
    if (
      status === 400 ||
      status === 422 ||
      code === "same_password" ||
      msg.includes("same password") ||
      msg.includes("must be different") ||
      msg.includes("different from") ||
      (msg.includes("new password") && msg.includes("old"))
    ) {
      const r: Resp = {
        ok: false,
        code: CODES.VALIDATION,
        message: t("passwordMustBeDifferent"),
      };
      const res = json(r, STATUS[CODES.VALIDATION]);
      copyCookies(baseRes, res);
      return res;
    }

    // Invalid / expired recovery context OR no session
    if (
      status === 401 ||
      msg.includes("jwt") ||
      msg.includes("unauthorized") ||
      msg.includes("auth session missing") ||
      msg.includes("session") ||
      msg.includes("expired")
    ) {
      const r: Resp = {
        ok: false,
        code: "RESET_LINK_INVALID_OR_EXPIRED",
        message: t("resetLinkInvalidOrExpired"),
      };
      const res = json(r, 401);
      copyCookies(baseRes, res);
      return res;
    }

    const r: Resp = {
      ok: false,
      code: CODES.UNEXPECTED_ERROR,
      message: t("supabase"),
    };
    const res = json(r, STATUS[CODES.UNEXPECTED_ERROR]);
    copyCookies(baseRes, res);
    return res;
  }

  if (!data?.user) {
    const r: Resp = {
      ok: false,
      code: "RESET_LINK_INVALID_OR_EXPIRED",
      message: t("resetLinkInvalidOrExpired"),
    };
    const res = json(r, 401);
    copyCookies(baseRes, res);
    return res;
  }

  const r: Resp = {
    ok: true,
    code: "PASSWORD_UPDATED",
    message: t("passwordUpdated"),
  };
  const res = json(r, 200);
  copyCookies(baseRes, res);
  return res;
}
