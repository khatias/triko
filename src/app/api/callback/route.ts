// app/api/callback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.json(
        { error: "Failed to authenticate" },
        { status: 400 }
      );
    }

    const redirectUrl = (() => {
      try {
        const candidate = new URL(nextParam, url.origin);
        return candidate.origin === url.origin
          ? candidate
          : new URL("/", url.origin);
      } catch {
        return new URL("/", url.origin);
      }
    })();

    console.log("OAuth login successful!");
    return NextResponse.redirect(redirectUrl);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Error during authentication process:", message);
    return NextResponse.json(
      {
        error: `An error occurred during the authentication process: ${message}`,
      },
      { status: 500 }
    );
  }
}
