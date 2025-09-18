import { supabase } from "../supabase/clients";

export const handleGoogleLogin = async (e: React.MouseEvent) => {
  e.preventDefault();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("GitHub login error:", error);
  }
};
