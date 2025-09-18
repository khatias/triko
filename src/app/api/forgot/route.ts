// app/api/auth/forgot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const form = await req.formData();

    const rawEmail = String(form.get("email") ?? "");
    const email = rawEmail.normalize("NFKC").trim().toLowerCase();
    const website = String(form.get("website") ?? ""); // honeypot

    // Prefer header; allow ?locale= fallback (useful for non-JS forms)
    const url = new URL(req.url);
    const locale =
      req.headers.get("x-next-intl-locale")?.trim() ||
      url.searchParams.get("locale")?.trim() ||
      "en";

    if (website) {
      // Pretend success for bots
      return NextResponse.json(
        { code: "OK", message: "If the email exists, a reset link will be sent." },
        { status: 200 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { code: "VALIDATION", message: "Email is required." },
        { status: 400 }
      );
    }

    const origin = url.origin;
    // After user clicks the email link, we’ll land on /api/callback (below),
    // which exchanges the code and redirects to /{locale}/reset-password
    const redirectTo = `${origin}/api/callback?next=/${locale}/reset-password&locale=${locale}`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error("[auth/forgot] resetPasswordForEmail error:", error);
      // Don’t reveal if email exists
      return NextResponse.json(
        { code: "RESET_FAILED", message: "Could not send password reset email." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        code: "RESET_SENT",
        message: "We’ve sent a password reset link if the address exists.",
        email,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[auth/forgot] unexpected error:", message);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: "Unexpected error sending reset email." },
      { status: 500 }
    );
  }
}
