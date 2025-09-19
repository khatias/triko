// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { CODES, STATUS, type ApiCode } from "@/utils/auth/codes";
import {
  isValidEmail,
  isValidPassword,
  sanitizeEmail,
} from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENUMERATION_SAFE = false as const;

type Api =
  | { ok: true; code: ApiCode; message: string; email?: string }
  | { ok: false; code: ApiCode; message: string; email?: string };

function json(r: Api) {
  const status = STATUS[r.code] ?? (r.ok ? 200 : 400);
  return NextResponse.json(r, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  const t = await getTranslations({
    locale: req.headers.get("x-next-intl-locale") ?? "ka",
    namespace: "auth",
  });

  try {
    const ct = (req.headers.get("content-type") || "").toLowerCase();
    if (!ct.startsWith("application/x-www-form-urlencoded")) {
      return json({
        ok: false,
        code: CODES.UNSUPPORTED_MEDIA_TYPE,
        message: t("unsupported"),
      });
    }

    const form = await req.formData();
    const action = String(form.get("action") ?? "");
    const email = sanitizeEmail(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const honeypot = String(form.get("website") ?? "");
    const full_name = String(form.get("full_name") ?? "");

    // Bot trap: pretend success to waste their time
    if (honeypot) {
      return json({
        ok: true,
        code: CODES.SIGNUP_VERIFY_EMAIL_SENT,
        message: t("signupSuccess", { email }),
        email,
      });
    }

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return json({
        ok: false,
        code: CODES.VALIDATION,
        message: t("required"),
      });
    }

    const supabase = await createClient();

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: full_name,
          },
        },
      });

      // 1) Explicit collision from Supabase
      if (error) {
        if (error.code === "user_already_exists") {
          if (!ENUMERATION_SAFE) {
            return json({
              ok: false,
              code: CODES.EMAIL_ALREADY_REGISTERED,
              message: t("emailInUse"),
              email,
            });
          }
          return json({
            ok: true,
            code: CODES.SIGNUP_VERIFY_EMAIL_SENT,
            message: t("signupSuccess", { email }),
            email,
          });
        }
        return json({
          ok: false,
          code: CODES.SUPABASE_SIGNUP_ERROR,
          message: t("supabase"),
        });
      }

      // 2) “Success” but actually existing account pattern: identities = []
      const identities = data?.user?.identities ?? [];
      const looksExisting =
        identities.length === 0 && data?.user?.email?.toLowerCase?.() === email;

      if (looksExisting && !ENUMERATION_SAFE) {
        return json({
          ok: false,
          code: CODES.EMAIL_ALREADY_REGISTERED,
          message: t("emailInUse"),
          email,
        });
      }

      // Real success: verification link sent
      return json({
        ok: true,
        code: CODES.SIGNUP_VERIFY_EMAIL_SENT,
        message: t("signupSuccess", { email }),
        email,
      });
    }

    if (action === "login" || action === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        return json({
          ok: true,
          code: CODES.SIGNIN_OK,
          message: t("signinSuccess"),
          email,
        });
      }
      if (error.code === "email_not_confirmed") {
        return json({
          ok: false,
          code: CODES.EMAIL_NOT_CONFIRMED,
          message: t("emailNotConfirmed", { email }),
        });
      }
      if (
        error.code === "over_email_send_rate_limit" ||
        error.code === "over_request_rate_limit"
      ) {
        return json({
          ok: false,
          code: CODES.RATE_LIMITED,
          message: t("rateLimit"),
        });
      }
      return json({
        ok: false,
        code: CODES.INVALID_CREDENTIALS,
        message: t("badCredentials"),
      });
    }

    return json({
      ok: false,
      code: CODES.INVALID_ACTION,
      message: t("invalidAction"),
    });
  } catch {
    return json({
      ok: false,
      code: CODES.UNEXPECTED_ERROR,
      message: t("unexpected"),
    });
  }
}
