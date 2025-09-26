import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "./utils/supabase/server";

const intl = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run i18n routing first (this may redirect or rewrite)
  const intlResponse = intl(request) as NextResponse;
  const supabase = createClient();

  const { data } = await (await supabase).auth.getSession();

  const session = data?.session;
  const isLoginPage = request.nextUrl.pathname.includes("/login");
  const isRestrictedPage = ["/profile"].some((path) =>
    request.nextUrl.pathname.includes(path)
  );

  if (!session && !isLoginPage && isRestrictedPage) {
    const locale = request.nextUrl.pathname.startsWith("/ka") ? "ka" : "en";
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (
    !request.nextUrl.pathname.startsWith("/en") &&
    !request.nextUrl.pathname.startsWith("/ka")
  ) {
    const defaultLocale = "en";
    const redirectUrl = new URL(
      `/${defaultLocale}${request.nextUrl.pathname}`,
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // If we got a redirect or rewrite response, we don't need to continue
  if (intlResponse?.status === 307 || intlResponse?.status === 308) {
    return intlResponse;
  }

  // Now run Supabase Auth middleware to attach/refresh cookies
  // Ensure we always return the intl response (to preserve its headers/redirects),
  // but let Supabase attach/refresh cookies on the SAME response.
  const finalResponse = await updateSession(request, intlResponse);
  return finalResponse;
}

// Single, consolidated matcher (excludes API, Next internals, static assets, and dot-files)
export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|.*\\..*).*)",
  ],
};
