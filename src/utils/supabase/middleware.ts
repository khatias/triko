import { createServerClient } from "@supabase/ssr";
import { NextResponse, NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next()
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // refresh the auth token (sets cookies on response when needed)
  await supabase.auth.getUser();

  return response;
}
