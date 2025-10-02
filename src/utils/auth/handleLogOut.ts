import { supabase } from "../supabase/clients";

export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut(); //
    if (error) throw error;
  } catch (e) {
    console.error("Logout failed:", e);
  } finally {
    window.location.assign("/");
  }
}
