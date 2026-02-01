import { createClient } from "@/utils/supabase/server";

export type ShopGroup = {
  group_id: number;
  fina_name: string | null;
  name_en: string | null;
  name_ka: string | null;
  slug_en: string | null;
  sort_order: number | null;
};

const GROUPS_VIEW = "shop_visible_groups_v2";

export async function getVisibleGroups(): Promise<ShopGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(GROUPS_VIEW)
    .select("group_id, fina_name, name_en, name_ka, slug_en, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getVisibleGroups error:", error);
    throw new Error("Failed to fetch visible groups");
  }

  return (data ?? []) as ShopGroup[];
}

export async function getGroupBySlug(
  slugEn: string,
): Promise<ShopGroup | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(GROUPS_VIEW)
    .select("group_id, fina_name, name_en, name_ka, slug_en, sort_order")
    .eq("slug_en", slugEn)
    .maybeSingle();

  if (error) {
    console.error("getGroupBySlug error:", error);
    throw new Error("Failed to fetch group by slug");
  }

  return (data ?? null) as ShopGroup | null;
}
