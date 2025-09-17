import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const intl = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run i18n routing first (this may redirect or rewrite)
  const intlResponse = intl(request) as NextResponse;

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
