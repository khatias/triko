import "server-only";
import { requireAdmin } from "@/utils/auth/requireAdmin";

export type ParentOption = {
  parent_code: string;
  name: string | null;
  group_id: number | null;
};

export async function searchParentOptions(locale: string, q: string) {
  const { supabase } = await requireAdmin(locale);

  // use SQL via .rpc if you have it; otherwise use a view.
  // simplest: query a VIEW (recommended).
  const { data, error } = await supabase
    .from("shop_admin_parent_options_v1")
    .select("parent_code,name,group_id")
    .ilike("parent_code", `%${q}%`)
    .order("parent_code", { ascending: true })
    .limit(30);

  if (error) throw new Error(error.message);
  return (data ?? []) as ParentOption[];
}