import { requireAdmin } from "@/utils/auth/requireAdmin";

export type AdminGroupRow = {
  idx: number;
  group_id: number;
  fina_name: string;
  name_en: string | null;
  name_ka: string | null;
  sort_order: number | null;
  is_visible: boolean;
  slug_en: string | null;
  raw: unknown;
  updated_at: string | null;
};

export async function fetchAdminGroups(locale: string) {
  const { supabase } = await requireAdmin(locale);

  const { data, error } = await supabase
    .from("admin_groups_view")
    .select(
      "idx, group_id, fina_name, name_en, name_ka, sort_order, is_visible, slug_en, raw, updated_at",
    )
    .order("idx", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as AdminGroupRow[];
}
