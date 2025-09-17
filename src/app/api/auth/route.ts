// app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { createClient } from "../../../utils/supabse/server";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENUMERATION_SAFE = true;

function json(body: unknown, init?: number | ResponseInit) {
  const base = typeof init === "number" ? { status: init } : init ?? {};
  return NextResponse.json(body, {
    ...(base as ResponseInit),
    headers: {
      ...((base as ResponseInit).headers || {}),
      "Cache-Control": "no-store",
    },
  });
}

function normalizeEmail(raw: string) {
  return raw.normalize("NFKC").trim().toLowerCase();
}

function isValidEmail(email: string) {
  if (!email || email.length > 254) return false;
  // Simple RFC 5322-ish format check; rely on zod for stricter client-side rules
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(pw: string) {
  return typeof pw === "string" && pw.length >= 8 && pw.length <= 72;
}

export async function POST(req: NextRequest) {
  const locale = (await nextHeaders()).get("x-next-intl-locale") ?? "en";
  const t = await getTranslations({ locale, namespace: "auth" });

  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
      return json(
        {
          ok: false,
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: t("unsupported"),
        },
        415
      );
    }

    const formData = await req.formData();
    const action = String(formData.get("action") ?? "");
    const rawEmail = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const honeypot = String(formData.get("website") ?? ""); // bot trap

    const email = normalizeEmail(rawEmail);

    // Honeypot: silently succeed to avoid tipping off bots
    if (honeypot) {
      return json(
        {
          ok: true,
          code: "SIGNUP_VERIFY_EMAIL_SENT",
          message: t("signupSuccess"),
          email,
        },
        200
      );
    }

    if (!isValidEmail(email) || !isValidPassword(password)) {
      return json(
        { ok: false, code: "VALIDATION", message: t("required") },
        400
      );
    }

    const supabase = await createClient();

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error && (error.status ?? 400) !== 200) {
        const code = error.code ?? "SUPABASE_SIGNUP_ERROR";
        if (code === "user_already_exists") {
          return ENUMERATION_SAFE
            ? json(
                {
                  ok: true,
                  code: "SIGNUP_VERIFY_EMAIL_SENT",
                  message: t("signupSuccess"),
                  email,
                },
                200
              )
            : json(
                {
                  ok: false,
                  code: "EMAIL_ALREADY_REGISTERED",
                  message: t("emailInUse"),
                },
                409
              );
        }
        return json(
          { ok: false, code: "SUPABASE_SIGNUP_ERROR", message: t("supabase") },
          400
        );
      }

      // With email confirmation enabled, identities can be empty for existing users.
      const identities = data?.user?.identities ?? [];
      const looksExisting =
        identities.length === 0 && data?.user?.email?.toLowerCase() === email;

      if (looksExisting) {
        return ENUMERATION_SAFE
          ? json(
              {
                ok: true,
                code: "SIGNUP_VERIFY_EMAIL_SENT",
                message: t("signupSuccess"),
                email,
              },
              200
            )
          : json(
              {
                ok: false,
                code: "EMAIL_ALREADY_REGISTERED",
                message: t("emailInUse"),
              },
              409
            );
      }

      return json(
        {
          ok: true,
          code: "SIGNUP_VERIFY_EMAIL_SENT",
          message: t("signupSuccess"),
          email,
        },
        200
      );
    }

    return json(
      { ok: false, code: "INVALID_ACTION", message: t("invalidAction") },
      400
    );
  } catch (err) {
    console.error("Auth route error:", err);
    return json(
      { ok: false, code: "UNEXPECTED_ERROR", message: t("unexpected") },
      500
    );
  }
}
