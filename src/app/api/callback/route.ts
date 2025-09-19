export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/";

  if (!code) return NextResponse.redirect(new URL("/error", url.origin));

  const supabase = await createClient();

  //  Dynamic import so the admin module is only evaluated at request time
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data?.user) {
      console.error("exchangeCodeForSession error:", error);
      return NextResponse.json(
        { error: "Failed to authenticate" },
        { status: 400 }
      );
    }

    const user = data.user;
    const email = (user.email ?? "").toLowerCase();
    const full_name = String(user.user_metadata?.full_name ?? "");

    const locale = String(user.user_metadata?.locale ?? "ka");

    // 1) Ensure profile
    {
      const { error: upsertErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          { user_id: user.id, email, full_name, locale },
          { onConflict: "user_id" }
        );
      if (upsertErr) console.error("profiles.upsert error:", upsertErr);
    }

    // 2) Ensure active cart via RPC + fallback
    {
      const { data: rpcCart, error: rpcErr } = await supabaseAdmin.rpc(
        "get_or_create_cart",
        {
          p_user_id: user.id,
          p_cart_token: null,
          p_currency: "GEL",
        }
      );
      if (rpcErr) console.error("get_or_create_cart RPC error:", rpcErr);

      if (!rpcCart?.id) {
        const { data: existing, error: selErr } = await supabaseAdmin
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        if (selErr) console.error("carts select error:", selErr);

        if (!existing?.id) {
          const { error: insErr } = await supabaseAdmin
            .from("carts")
            .insert({ user_id: user.id, status: "active", currency: "GEL" });
          if (insErr) console.error("carts insert fallback error:", insErr);
        }
      }
    }

    // 3) Safe redirect
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

    return NextResponse.redirect(redirectUrl);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("callback fatal error:", message);
    return NextResponse.json(
      { error: `Auth callback error: ${message}` },
      { status: 500 }
    );
  }
}
