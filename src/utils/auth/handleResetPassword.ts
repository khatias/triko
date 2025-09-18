// utils/auth/handleResetPassword.ts
import { supabase } from "../supabase/clients";

export const handleResetPassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Reset password error:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
};
