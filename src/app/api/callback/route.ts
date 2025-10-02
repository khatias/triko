// app/api/callback/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const supabase = await createClient();

  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );
    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError);
      return NextResponse.json(
        { error: "Failed to authenticate" },
        { status: 400 }
      );
    }

    const { data: userRes, error: getUserErr } = await supabase.auth.getUser();
    if (getUserErr || !userRes?.user?.id) {
      console.error("auth.getUser error:", getUserErr);
      return NextResponse.json(
        { error: "Failed to get user" },
        { status: 400 }
      );
    }

    const userId = userRes.user.id;

    const { data: profile, error: profileSelErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileSelErr) {
      console.warn("profiles select warning:", profileSelErr);
    }

    if (!profile) {
      const { error: insertProfileError } = await supabase
        .from("profiles")
        .insert([
          {
            user_id: userId,
            email: userRes.user.email,
            first_name: "",
            last_name: "",
            avatar_url: null,
          },
        ]);
      if (insertProfileError) {
        console.error("Profile creation failed:", insertProfileError);
      }
    }

    // 4) Ensure a cart exists (service role)
    try {
      const { data: rpcCart, error: rpcErr } = await supabaseAdmin.rpc(
        "get_or_create_cart",
        {
          p_user_id: userId,
          p_cart_token: null,
          p_currency: "GEL",
        }
      );

      if (rpcErr) {
        console.error("get_or_create_cart RPC error:", rpcErr);
      }

      if (!rpcCart?.id) {
        const { data: existing, error: selErr } = await supabaseAdmin
          .from("carts")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle();

        if (selErr) console.error("carts select error:", selErr);

        if (!existing?.id) {
          const { error: insErr } = await supabaseAdmin
            .from("carts")
            .insert({ user_id: userId, status: "active", currency: "GEL" });
          if (insErr) console.error("carts insert fallback error:", insErr);
        }
      }
    } catch (cartErr) {
      console.error("Cart creation block error:", cartErr);
    }

   
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(new URL("/profile", origin));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("OAuth callback error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
