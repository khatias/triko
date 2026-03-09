// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const CART_COOKIE = "cart_token";

function isStaticOrPublicFile(pathname: string) {
  if (pathname === "/favicon.ico" || pathname.endsWith("/favicon.ico")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true; // any file.ext
  return false;
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (isStaticOrPublicFile(pathname)) {
    return NextResponse.next();
  }

  // locale handling
  const res = intl(req);

  // cart token cookie
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

  return res;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};