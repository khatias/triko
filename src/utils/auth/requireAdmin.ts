import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type AdminRole = "admin" | "owner" | "staff";

export async function requireAdmin(
  locale: string,
  allowed: AdminRole[] = ["admin", "owner"],
) {
  const supabase = await createClient();

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) redirect(`/${locale}/login`);

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", auth.user.id)
    .single();

  const role = profile?.role as AdminRole | undefined;
  if (profileErr || !role || !allowed.includes(role)) redirect(`/${locale}`);

  return { supabase, user: auth.user, role };
}
