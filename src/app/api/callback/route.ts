// // app/api/callback/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/utils/supabase/server";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// const CART_COOKIE = "cart_token";

// function isSafeNextPath(value: string | null) {
//   if (!value) return false;
//   return value.startsWith("/") && !value.startsWith("//");
// }

// function isUuid(value: string) {
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
//     value,
//   );
// }

// function inferLocaleFromPath(path: string) {
//   const seg = path.split("/")[1];
//   return seg === "en" ? "en" : "ka";
// }

// export async function GET(req: NextRequest) {
//   const url = new URL(req.url);

//   const code = url.searchParams.get("code");
//   const nextParam = url.searchParams.get("next");
//   const redirectPath = isSafeNextPath(nextParam) ? nextParam! : "/";

//   const locale = inferLocaleFromPath(redirectPath);

//   if (!code) {
//     return NextResponse.redirect(new URL(`/login?error=missing_code`, req.url));
//   }

//   // default redirect, we may override Location later if admin
//   const res = NextResponse.redirect(new URL(redirectPath, req.url));

//   const supabase = await createClient();

//   try {
//     const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

//     if (exchangeError) {
//       console.error("exchangeCodeForSession error:", exchangeError);
//       return NextResponse.redirect(new URL(`/login?error=oauth_exchange`, req.url));
//     }

//     const {
//       data: { user },
//       error: getUserErr,
//     } = await supabase.auth.getUser();

//     if (getUserErr || !user?.id) {
//       console.error("auth.getUser error:", getUserErr);
//       return NextResponse.redirect(new URL(`/login?error=user_fetch`, req.url));
//     }

//     const userId = user.id;

//     // Fetch role (and create profile if missing)
//     const { data: profile, error: profileSelErr } = await supabase
//       .from("profiles")
//       .select("user_id, role")
//       .eq("user_id", userId)
//       .maybeSingle();

//     if (profileSelErr) {
//       console.warn("profiles select warning:", profileSelErr);
//     }

//     if (!profile) {
//       const { error: insertProfileError } = await supabase.from("profiles").insert([
//         {
//           user_id: userId,
//           email: user.email ?? null,
//           first_name: "",
//           last_name: "",
//           avatar_url: null,
//           role: "customer", // adjust default if you want
//         },
//       ]);

//       if (insertProfileError) {
//         console.error("Profile creation failed:", insertProfileError);
//       }
//     }

//     // Determine admin, if profile was missing we re-check role once
//     let role = profile?.role ?? null;

//     if (!role) {
//       const { data: p2 } = await supabase
//         .from("profiles")
//         .select("role")
//         .eq("user_id", userId)
//         .maybeSingle();
//       role = p2?.role ?? null;
//     }

//     const isAdmin = role === "admin";
//     if (isAdmin) {
//       res.headers.set("Location", new URL(`/${locale}/admin`, req.url).toString());
//     }

//     const token = req.cookies.get(CART_COOKIE)?.value ?? null;

//     if (token && isUuid(token)) {
//       const { error: mergeError } = await supabase.rpc("cart_merge_guest_into_user_v2", {
//         p_cart_token: token,
//       });

//       if (mergeError) {
//         console.error("cart merge failed:", mergeError);
//       } else {
//         res.cookies.set(CART_COOKIE, "", {
//           path: "/",
//           maxAge: 0,
//           httpOnly: true,
//           sameSite: "lax",
//           secure: process.env.NODE_ENV === "production",
//         });
//       }
//     }

//     return res;
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : String(err);
//     console.error("OAuth callback error:", message);
//     return NextResponse.redirect(new URL(`/login?error=callback_exception`, req.url));
//   }
// }
// app/api/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const CART_COOKIE = "cart_token";

function isSafeNextPath(value: string | null): value is string {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//");
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function inferLocaleFromPath(path: string): "en" | "ka" {
  const seg = path.split("/")[1];
  return seg === "en" ? "en" : "ka";
}

function mask(s: string | null | undefined, keep = 6): string | null {
  if (!s) return null;
  if (s.length <= keep) return "***";
  return `${s.slice(0, keep)}…(${s.length})`;
}

type EnvStatus = {
  NODE_ENV: string | undefined;
  SUPABASE_URL_present: boolean;
  PUBLISHABLE_present: boolean;
  ANON_present: boolean;
  SUPABASE_URL_len: number;
  PUBLISHABLE_len: number;
  ANON_len: number;
};

function envStatus(): EnvStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL_present: Boolean(url),
    PUBLISHABLE_present: Boolean(pub),
    ANON_present: Boolean(anon),
    SUPABASE_URL_len: url?.length ?? 0,
    PUBLISHABLE_len: pub?.length ?? 0,
    ANON_len: anon?.length ?? 0,
  };
}

type CookieMeta = { name: string; len: number };
function safeCookieList(req: NextRequest): CookieMeta[] {
  return req.cookies.getAll().map((c) => ({ name: c.name, len: c.value.length }));
}

type ErrorLike = { name?: string; message?: string; stack?: string; status?: number; code?: string };

function toErrorLike(e: unknown): ErrorLike {
  if (e instanceof Error) {
    // Error has name/message/stack
    return { name: e.name, message: e.message, stack: e.stack };
  }
  if (typeof e === "object" && e !== null) {
    const o = e as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name : undefined;
    const message = typeof o.message === "string" ? o.message : undefined;
    const stack = typeof o.stack === "string" ? o.stack : undefined;
    const status = typeof o.status === "number" ? o.status : undefined;
    const code = typeof o.code === "string" ? o.code : undefined;
    return { name, message, stack, status, code };
  }
  if (typeof e === "string") return { message: e };
  return { message: String(e) };
}

type LogBase = { reqId: string };
type HitLog = LogBase & {
  method: string;
  url: string;
  path: string;
  hasCode: boolean;
  codeMasked: string | null;
  nextParam: string | null;
  redirectPath: string;
  locale: "en" | "ka";
  cookies: CookieMeta[];
  env: EnvStatus;
  ua: string | null;
  xff: string | null;
  xfproto: string | null;
  host: string | null;
};

function newReqId(): string {
  // crypto.randomUUID is available in runtime=nodejs; fallback anyway
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const url = new URL(req.url);

  const debug = url.searchParams.get("debug") === "1";
  const reqId = newReqId();

  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const redirectPath = isSafeNextPath(nextParam) ? nextParam : "/";

  const locale = inferLocaleFromPath(redirectPath);

  const log = (label: string, data: unknown) => {
    if (!debug) return;
    console.log(`[oauth-callback][${reqId}] ${label}`, data);
  };

  const errlog = (label: string, data: unknown) => {
    console.error(`[oauth-callback][${reqId}] ${label}`, data);
  };

  const hit: HitLog = {
    reqId,
    method: req.method,
    url: req.url,
    path: url.pathname,
    hasCode: Boolean(code),
    codeMasked: mask(code),
    nextParam,
    redirectPath,
    locale,
    cookies: safeCookieList(req),
    env: envStatus(),
    ua: req.headers.get("user-agent"),
    xff: req.headers.get("x-forwarded-for"),
    xfproto: req.headers.get("x-forwarded-proto"),
    host: req.headers.get("host"),
  };

  log("HIT", hit);

  if (!code) {
    log("Missing code -> redirect", { to: "/login?error=missing_code" });
    return NextResponse.redirect(new URL(`/login?error=missing_code`, req.url));
  }

  // default redirect (we may override Location later)
  const res = NextResponse.redirect(new URL(redirectPath, req.url));

  try {
    log("Step 1: createClient()", {});
    const supabase = await createClient();

    log("Step 2: exchangeCodeForSession()", { codeMasked: mask(code) });
    const exchange = await supabase.auth.exchangeCodeForSession(code);

    log("exchange result", {
      hasError: Boolean(exchange.error),
      error: exchange.error
        ? { name: exchange.error.name, message: exchange.error.message }
        : null,
    });

    if (exchange.error) {
      errlog("exchangeCodeForSession error", {
        name: exchange.error.name,
        message: exchange.error.message,
      });
      return NextResponse.redirect(new URL(`/login?error=oauth_exchange`, req.url));
    }

    log("Step 3: auth.getUser()", {});
    const u = await supabase.auth.getUser();

    log("getUser result", {
      hasError: Boolean(u.error),
      userId: u.data.user?.id ?? null,
      emailMasked: mask(u.data.user?.email ?? null),
      error: u.error ? { name: u.error.name, message: u.error.message } : null,
    });

    const user = u.data.user;
    if (u.error || !user?.id) {
      errlog("auth.getUser error", {
        error: u.error ? { name: u.error.name, message: u.error.message } : null,
      });
      return NextResponse.redirect(new URL(`/login?error=user_fetch`, req.url));
    }

    const userId = user.id;

    log("Step 4: select profile", { userId });
    const prof = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", userId)
      .maybeSingle();

    log("profile select result", {
      hasError: Boolean(prof.error),
      hasProfile: Boolean(prof.data),
      role: prof.data?.role ?? null,
      error: prof.error ? { message: prof.error.message } : null,
    });

    if (!prof.data) {
      log("Step 5: insert profile (missing)", { userId });
      const ins = await supabase.from("profiles").insert([
        {
          user_id: userId,
          email: user.email ?? null,
          first_name: "",
          last_name: "",
          avatar_url: null,
          role: "customer",
        },
      ]);

      log("profile insert result", {
        hasError: Boolean(ins.error),
        error: ins.error ? { message: ins.error.message } : null,
      });

      if (ins.error) errlog("Profile creation failed", { message: ins.error.message });
    }

    let role: string | null = prof.data?.role ?? null;

    if (!role) {
      log("Step 6: re-check role", { userId });
      const p2 = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      role = p2.data?.role ?? null;

      log("role recheck", {
        hasError: Boolean(p2.error),
        role,
        error: p2.error ? { message: p2.error.message } : null,
      });
    }

    const isAdmin = role === "admin";
    log("Step 7: admin?", { isAdmin, role });

    if (isAdmin) {
      res.headers.set("Location", new URL(`/${locale}/admin`, req.url).toString());
    }

    const token = req.cookies.get(CART_COOKIE)?.value ?? null;
    log("Step 8: cart token", {
      hasToken: Boolean(token),
      tokenMasked: mask(token),
      isUuid: token ? isUuid(token) : false,
    });

    if (token && isUuid(token)) {
      log("Step 9: rpc cart_merge_guest_into_user_v2", {});
      const mg = await supabase.rpc("cart_merge_guest_into_user_v2", {
        p_cart_token: token,
      });

      log("merge result", {
        hasError: Boolean(mg.error),
        error: mg.error ? { message: mg.error.message } : null,
      });

      if (mg.error) {
        errlog("cart merge failed", { message: mg.error.message });
      } else {
        res.cookies.set(CART_COOKIE, "", {
          path: "/",
          maxAge: 0,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
        log("cart cookie cleared", {});
      }
    }

    log("DONE", { ms: Date.now() - startedAt, redirectTo: res.headers.get("Location") });
    return res;
  } catch (e: unknown) {
    const el = toErrorLike(e);
    errlog("FATAL callback error", {
      ...el,
      ms: Date.now() - startedAt,
      env: envStatus(),
    });

    // debug=1 -> JSON 500 helps you see reqId and confirm origin responds
    if (debug) {
      return NextResponse.json(
        { ok: false, where: "api/callback", reqId, error: { name: el.name, message: el.message } },
        { status: 500 },
      );
    }

    return NextResponse.redirect(new URL(`/login?error=callback_exception`, req.url));
  }
}