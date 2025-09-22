import { supabase } from "../supabase/clients";

export const handleGoogleLogin = async (e: React.MouseEvent) => {
  e.preventDefault();
  const origin = window.location.origin; // e.g., http://localhost:3000 or https://preview.vercel.app
  const next = window.location.pathname + window.location.search; // where to go back after auth
  // if you want locale specifically: const locale = window.location.pathname.split("/")[1];

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      // MUST be allowlisted in Supabase → Auth → URL Configuration → Redirect URLs
      redirectTo: `${origin}/api/callback?next=${encodeURIComponent(next)}`,
      // or if you prefer locale: `${origin}/api/callback?locale=${locale}`
    },
  });

  if (error) {
    console.error("Google login error:", error);
  }
};
