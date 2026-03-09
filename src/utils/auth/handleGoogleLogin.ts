// src/utils/auth/handleGoogleLogin.ts
"use client";

import type React from "react";
import { supabase } from "../supabase/clients";

export const handleGoogleLogin = async (e: React.MouseEvent) => {
  e.preventDefault();

  const origin = window.location.origin;

  // infer locale from URL: /en/... or /ka/...
  const firstSeg = window.location.pathname.split("/")[1];
  const locale = firstSeg === "en" ? "en" : "ka";

  // ✅ Always go to profile after Google auth
  const next = `/${locale}/profile`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      // MUST be allowlisted in Supabase → Auth → URL Configuration → Redirect URLs
      redirectTo: `${origin}/api/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Google login error:", error);
  }
};




