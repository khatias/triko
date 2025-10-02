import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const intl = createMiddleware(routing);

// ---- Helpers ---------------------------------------------------------------

/** Detects presence of Supabase auth cookies on the incoming request */
function hasReqAuth(req: NextRequest) {
  const names = req.cookies.getAll().map((c) => c.name);
  return names.some(
    (n) =>
      n === "sb-access-token" ||
      n === "sb-refresh-token" ||
      /^sb-[^-]+-(access|refresh)-token$/.test(n) ||
      /^sb-[^-]+-auth-token$/.test(n)
  );
}

/** Detects if the response (after updateSession) just set Supabase auth cookies */
function hasResAuth(res: NextResponse) {
  // Works in Edge: NextResponse.cookies.getAll() mirrors cookies scheduled to be set
  const names = res.cookies.getAll().map((c) => c.name);
  if (
    names.some(
      (n) =>
        n === "sb-access-token" ||
        n === "sb-refresh-token" ||
        /^sb-[^-]+-(access|refresh)-token$/.test(n) ||
        /^sb-[^-]+-auth-token$/.test(n)
    )
  ) {
    return true;
  }
  // Fallback in case a framework version only exposes headers:
  const setCookieHeader = res.headers.get("set-cookie") || "";
  return /sb-(?:[^-]+)-(?:access|refresh)-token|sb-access-token|sb-refresh-token/.test(
    setCookieHeader
  );
}

// ---- Middleware ------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1) Locale handling first (preserves query string by default)
  //    We keep the returned response and continue composing on it.
  let response = intl(request) as NextResponse;

  // 2) Refresh Supabase session/cookies on the SAME response
  response = await updateSession(request, response);

  // 3) Route protection: only for profile pages under supported locales
  //    Example protected area: /en/profile, /ka/profile, /en/profile/orders, etc.
  const isProtected = /^\/(en|ka)\/profile(?:\/|$)/.test(pathname);

  // Allow auth routes to pass without redirects
  const isAuthRoute = /^\/(en|ka)\/(login|signup|confirm|auth\/confirm)(?:\/|$)/.test(
    pathname
  );

  if (isProtected && !isAuthRoute) {
    const loggedIn = hasReqAuth(request) || hasResAuth(response);
    if (!loggedIn) {
      // Infer locale from path (fallback to "en")
      const locale = pathname.split("/")[1] || "en";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      // Preserve intended destination:
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Optional: add a small header for diagnostics (visible in Network panel)
  response.headers.set("x-middleware", "ok");
  return response;
}

// Only run middleware on app paths, not static files, images, _next, or API
export const config = {
  matcher: [
    // Run on everything except Next internals, static assets, and API routes
    "/((?!api|trpc|_next|_vercel|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)).*)",
  ],
};
