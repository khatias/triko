// middleware.ts (root)
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const CART_COOKIE = "cart_token";

function getLocalePrefix(pathname: string) {
  for (const loc of routing.locales) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) return `/${loc}`;
  }
  return "";
}

export async function middleware(req: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Protected routes (make sure to include locale prefix)
  const isRestrictedPage = ["/profile", "/orders"].some((p) => pathname.includes(p));

  if (isRestrictedPage && !user) {
    const localePrefix = getLocalePrefix(pathname);
    const loginUrl = new URL(`${localePrefix}/login`, req.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);

    const redirectRes = NextResponse.redirect(loginUrl);

    // Preserve any cookies already set on res (supabase + cart)
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
    "/((?!api|trpc|_next|_vercel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|.*\\..*).*)",
  ],
};
