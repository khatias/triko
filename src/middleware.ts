import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const intl = createMiddleware(routing);

// Detect any Supabase auth cookie on the *request*
function hasReqAuth(req: NextRequest) {
  const names = req.cookies.getAll().map((c) => c.name);
  return names.some(
    (n) =>
      n === "sb-access-token" ||
      n === "sb-refresh-token" ||
      /^sb-[^-]+-(access|refresh)-token$/.test(n) ||       // sb-<projectRef>-access-token
      /^sb-[^-]+-auth-token$/.test(n)                      // legacy variants
  );
}

// Detect if updateSession just *set* tokens on the *response*
function hasResAuth(res: NextResponse) {
  const names = res.cookies.getAll().map((c) => c.name);
  return names.some(
    (n) =>
      n === "sb-access-token" ||
      n === "sb-refresh-token" ||
      /^sb-[^-]+-(access|refresh)-token$/.test(n) ||
      /^sb-[^-]+-auth-token$/.test(n)
  );
}

export async function middleware(request: NextRequest) {
  // 1) Locale rewrite (preserves ?search)
  const intlResponse = intl(request) as NextResponse;

  // 2) Refresh Supabase cookies on the SAME response
  const response = await updateSession(request, intlResponse);

  // 3) Protect /{locale}/profile... (allow auth pages)
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split("/")[1] || "en";
  const isProtected = /^\/(en|ka)\/profile(\/|$)/.test(pathname);
  const isAuthRoute = /^\/(en|ka)\/(login|signup|confirm|auth\/confirm)(\/|$)/.test(pathname);

  if (isProtected && !isAuthRoute) {
    const loggedIn = hasReqAuth(request) || hasResAuth(response);
    if (!loggedIn) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|.*\\..*).*)",
  ],
};
