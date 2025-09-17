// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabse/server";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Api =
  | { ok: true; code: string; message: string; email?: string }
  | { ok: false; code: string; message: string };

const ENUMERATION_SAFE = true as const;
const STATUS: Record<string, number> = {
  VALIDATION: 400,
  INVALID_ACTION: 400,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_CONFIRMED: 403,
  EMAIL_ALREADY_REGISTERED: 409,
  RATE_LIMITED: 429,
  UNSUPPORTED_MEDIA_TYPE: 415,
  SUPABASE_SIGNUP_ERROR: 400,
  UNEXPECTED_ERROR: 500,
};

const json = (r: Api) =>
  NextResponse.json(r, {
    status: r.ok ? 200 : STATUS[r.code] ?? 400,
    headers: { "Cache-Control": "no-store" },
  });

const normalizeEmail = (v: string) => v.normalize("NFKC").trim().toLowerCase();
const isValidEmail = (v: string) =>
  !!v && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPassword = (v: string) => typeof v === "string" && v.length >= 8 && v.length <= 72;

export async function POST(req: NextRequest) {
  const t = await getTranslations({
    locale: req.headers.get("x-next-intl-locale") ?? "en",
    namespace: "auth",
  });

  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
      return json({ ok: false, code: "UNSUPPORTED_MEDIA_TYPE", message: t("unsupported") });
    }

    const form = await req.formData();
    const action = String(form.get("action") ?? "");
    const email = normalizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const honeypot = String(form.get("website") ?? ""); // bot trap

    if (honeypot) {
      return json({
        ok: true,
        code: "SIGNUP_VERIFY_EMAIL_SENT",
        message: t("signupSuccess", { email }),
        email,
      });
    }

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return json({ ok: false, code: "VALIDATION", message: t("required") });
    }

    const supabase = await createClient();

    switch (action) {
      case "signup": {
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          if (error.code === "user_already_exists") {
            return ENUMERATION_SAFE
              ? json({ ok: true, code: "SIGNUP_VERIFY_EMAIL_SENT", message: t("signupSuccess", { email }), email })
              : json({ ok: false, code: "EMAIL_ALREADY_REGISTERED", message: t("emailInUse") });
          }
          return json({ ok: false, code: "SUPABASE_SIGNUP_ERROR", message: t("supabase") });
        }

        const identities = data?.user?.identities ?? [];
        const looksExisting = identities.length === 0 && data?.user?.email?.toLowerCase() === email;

        if (looksExisting && !ENUMERATION_SAFE) {
          return json({ ok: false, code: "EMAIL_ALREADY_REGISTERED", message: t("emailInUse") });
        }

        return json({ ok: true, code: "SIGNUP_VERIFY_EMAIL_SENT", message: t("signupSuccess", { email }), email });
      }

      case "signin":
      case "login": {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          return json({ ok: true, code: "SIGNIN_OK", message: t("signinSuccess"), email });
        }

        if (error.code === "email_not_confirmed") {
          return json({ ok: false, code: "EMAIL_NOT_CONFIRMED", message: t("emailNotConfirmed", { email }) });
        }
        if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
          return json({ ok: false, code: "RATE_LIMITED", message: t("rateLimit") });
        }
        return json({ ok: false, code: "INVALID_CREDENTIALS", message: t("badCredentials") });
      }

      default:
        return json({ ok: false, code: "INVALID_ACTION", message: t("invalidAction") });
    }
  } catch {
    return json({ ok: false, code: "UNEXPECTED_ERROR", message: t("unexpected") });
  }
}
