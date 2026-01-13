import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function requireAdmin(locale: string) {
  const supabase = await createClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", auth.user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect(`/${locale}`);

  return { supabase, user: auth.user };
}
