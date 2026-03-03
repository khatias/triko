// src/app/api/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
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

function inferLocaleFromPath(path: string) {
  const seg = path.split("/")[1];
  return seg === "en" ? "en" : "ka";
}

async function getOriginSafe() {
  // 1) Prefer explicit env (best + stable)
  const envOrigin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_SITE_URL;

  if (envOrigin && envOrigin.startsWith("http")) return envOrigin.replace(/\/+$/, "");

  // 2) Fallback to forwarded headers (behind Cloudflare/Nginx)
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (host) return `${proto}://${host}`;

  // 3) Last resort hard fallback
  return "https://beta.triko.ge";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const redirectPath = isSafeNextPath(nextParam) ? nextParam! : "/";

  const locale = inferLocaleFromPath(redirectPath);

  const origin = await getOriginSafe();

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code`, origin));
  }

  // default redirect, we may override Location later if admin
  const res = NextResponse.redirect(new URL(redirectPath, origin));

  const supabase = await createClient();

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("exchangeCodeForSession error:", exchangeError);
      return NextResponse.redirect(new URL(`/login?error=oauth_exchange`, origin));
    }

    const {
      data: { user },
      error: getUserErr,
    } = await supabase.auth.getUser();

    if (getUserErr || !user?.id) {
      console.error("auth.getUser error:", getUserErr);
      return NextResponse.redirect(new URL(`/login?error=user_fetch`, origin));
    }

    const userId = user.id;

    // Fetch role (and create profile if missing)
    const { data: profile, error: profileSelErr } = await supabase
      .from("profiles")
      .select("user_id, role")
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
          role: "customer",
        },
      ]);

      if (insertProfileError) {
        console.error("Profile creation failed:", insertProfileError);
      }
    }

    // Determine admin, if profile was missing we re-check role once
    let role = profile?.role ?? null;

    if (!role) {
      const { data: p2 } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      role = p2?.role ?? null;
    }

    const isAdmin = role === "admin";
    if (isAdmin) {
      // IMPORTANT: build URL from safe origin, not req.url
      res.headers.set("Location", new URL(`/${locale}/admin`, origin).toString());
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
    return NextResponse.redirect(new URL(`/login?error=callback_exception`, origin));
  }
}