// app/api/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CART_COOKIE = "cart_token";

function isSafeNextPath(value: string | null) {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const redirectPath = isSafeNextPath(nextParam) ? nextParam! : "/";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, req.url));
  }

  const res = NextResponse.redirect(new URL(redirectPath, req.url));

  // IMPORTANT: bind supabase cookie writes to THIS response
  const supabase = await createClient();

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError);
      return NextResponse.redirect(new URL(`/login?error=oauth_exchange`, req.url));
    }

    const {
      data: { user },
      error: getUserErr,
    } = await supabase.auth.getUser();

    if (getUserErr || !user?.id) {
      console.error("auth.getUser error:", getUserErr);
      return NextResponse.redirect(new URL(`/login?error=user_fetch`, req.url));
    }

    const userId = user.id;

    // Create profile if missing (optional; consider trigger-based approach)
    const { data: profile, error: profileSelErr } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileSelErr) {
      console.warn("profiles select warning:", profileSelErr);
    }

    if (!profile) {
      const { error: insertProfileError } = await supabase.from("profiles").insert([
        {
          user_id: userId,
          email: user.email ?? null,
          first_name: "",
          last_name: "",
          avatar_url: null,
        },
      ]);

      if (insertProfileError) {
        console.error("Profile creation failed:", insertProfileError);
        // keep going
      }
    }

    const token = req.cookies.get(CART_COOKIE)?.value ?? null;

    if (token && isUuid(token)) {
      const { error: mergeError } = await supabase.rpc("cart_merge_guest_into_user_v2", {
        p_cart_token: token,
      });

      if (mergeError) {
        console.error("cart merge failed:", mergeError);
      } else {
        res.cookies.set(CART_COOKIE, "", {
          path: "/",
          maxAge: 0,
          // match how you originally set it:
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OAuth callback error:", message);
    return NextResponse.redirect(new URL(`/login?error=callback_exception`, req.url));
  }
}
