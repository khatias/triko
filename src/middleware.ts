// middleware.ts (root)
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localeDetection: false,
});

const CART_COOKIE = "cart_token";

function getLocalePrefix(pathname: string) {
  for (const loc of routing.locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) return `/${loc}`;
  }
  return "";
}

function getFirstSegmentAfterLocale(pathname: string) {
  const localePrefix = getLocalePrefix(pathname);
  const pathAfterLocale = localePrefix ? pathname.slice(localePrefix.length) || "/" : pathname;
  const firstSeg = pathAfterLocale.split("/").filter(Boolean)[0] ?? "";
  return { localePrefix, firstSeg };
}

function isStaticOrPublicFile(pathname: string) {
  // Covers: /favicon.ico AND /ka/favicon.ico, images, etc.
  if (pathname === "/favicon.ico" || pathname.endsWith("/favicon.ico")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/")) return true;
  // Any file with an extension should bypass middleware
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // ✅ ABSOLUTE FIRST: never touch intl/supabase for static files
  if (isStaticOrPublicFile(pathname)) {
    return NextResponse.next();
  }

  // Base response must be intl(req)
  const res = intl(req);

  // Ensure cart_token exists (NO redirect needed)
  const hasCart = req.cookies.get(CART_COOKIE)?.value;
  if (!hasCart) {
    res.cookies.set(CART_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Setup Supabase SSR client with THIS response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    }
  );

type UserLike = { id: string } | null;

let user: UserLike = null;

try {
  const { data, error } = await supabase.auth.getUser();
  if (!error && data?.user?.id) {
    user = { id: data.user.id };
  }
} catch {
  user = null;
}


  // ✅ Safe restricted route check (segment-based, locale-aware)
  const { localePrefix, firstSeg } = getFirstSegmentAfterLocale(pathname);

  const isRestrictedPage = ["profile", "orders", "checkout"].includes(firstSeg);
  const isAuthPage = ["login", "signup", "forgot-password", "reset-password"].includes(firstSeg);

  if (isRestrictedPage && !isAuthPage && !user) {
    const loginUrl = new URL(`${localePrefix}/login`, req.url);
    loginUrl.searchParams.set("next", pathname);

    const redirectRes = NextResponse.redirect(loginUrl);

    // Preserve cookies already set on res (supabase + cart)
    for (const c of res.cookies.getAll()) {
      redirectRes.cookies.set(c.name, c.value, {
        path: c.path,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        secure: c.secure,
        expires: c.expires,
        maxAge: c.maxAge,
        domain: c.domain,
      });
    }

    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: [
    // simpler and safer: exclude api/_next/_vercel and any "file.ext"
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
