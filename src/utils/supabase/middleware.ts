// utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes Supabase auth cookies on the SAME response object you pass in.
 * Safe for Edge middleware (no Node-only APIs).
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next()
): Promise<NextResponse> {
  // ⚠️ Ensure these envs are set in Vercel (Production/Preview),
  // matching your local .env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (anon key)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // This will refresh tokens if needed and set cookies on `response`
  // Never throws if cookies are simply missing.
  await supabase.auth.getUser();

  return response;
}
