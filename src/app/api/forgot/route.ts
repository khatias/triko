import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { CODES, STATUS, type ApiCode } from "@/utils/auth/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENUMERATION_SAFE = true as const;

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

const sanitizeEmail = (v: unknown) =>
  String(v ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

export async function POST(req: NextRequest) {
  const locale =
    req.headers.get("x-next-intl-locale")?.trim() ||
    new URL(req.url).searchParams.get("locale")?.trim() ||
    "ka";

  const t = await getTranslations({ locale, namespace: "auth" });

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
    const email = sanitizeEmail(form.get("email"));
    const honeypot = String(form.get("website") ?? ""); // bot trap

    // If bot → always pretend success
    if (honeypot) {
      return json({
        ok: true,
        code: CODES.PASSWORD_RESET_SENT,
        message: t("passwordResetSent"),
        email,
      });
    }

    if (!email) {
      return json({
        ok: false,
        code: CODES.VALIDATION,
        message: t("required"),
      });
    }

    const supabase = await createClient();

    const url = new URL(req.url);
    const origin = url.origin;
    const redirectTo = `${origin}/${locale}/reset-password?locale=${encodeURIComponent(
      locale
    )}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[auth/forgot] resetPasswordForEmail error:", error);

      if (ENUMERATION_SAFE) {
        return json({
          ok: true,
          code: CODES.PASSWORD_RESET_SENT,
          message: t("passwordResetSent"),
          email,
        });
      }

      return json({
        ok: false,
        code: CODES.PASSWORD_RESET_FAILED,
        message: t("passwordResetFailed"),
      });
    }

    return json({
      ok: true,
      code: CODES.PASSWORD_RESET_SENT,
      message: t("passwordResetSent"),
      email,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[auth/forgot] unexpected error:", message);
    return json({
      ok: false,
      code: CODES.UNEXPECTED_ERROR,
      message: t("unexpected"),
    });
  }
}
