import { createClient } from "@/utils/supabase/server";

export type FeaturedGroup = {
  group_id: number;
  name_en: string | null;
  name_ka: string | null;
  slug_en: string | null;
  sort_order: number | null;
  featured_home_order: number | null;
  featured_home_image_path: string | null;
  featured_home_alt_en: string | null;
  featured_home_alt_ka: string | null;
};

// src/lib/db/groups.ts

export type ShopGroup = {
  idx: number;
  group_id: number;
  parent_group_id: number | null;
  name_en: string | null;
  name_ka: string | null;
  slug_en: string | null;
  sort_order: number | null;
  is_visible: boolean;
  raw: unknown;
  updated_at: string;
};

const GROUPS_VIEW = "shop_visible_groups_v2";

export async function getVisibleGroups(): Promise<ShopGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(GROUPS_VIEW)
    .select("group_id, parent_group_id, name_en, name_ka, slug_en, sort_order")
    .eq("is_visible", true)
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
    .select("group_id, parent_group_id, name_en, name_ka, slug_en, sort_order")
    .eq("slug_en", slugEn)
    .maybeSingle();

  if (error) {
    console.error("getGroupBySlug error:", error);
    throw new Error("Failed to fetch group by slug");
  }

  return (data ?? null) as ShopGroup | null;
}

export async function getFeaturedGroups(): Promise<FeaturedGroup[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_group_settings")
    .select(
      "group_id,  name_en, name_ka, slug_en, sort_order, featured_home_order, featured_home_image_path,featured_home_alt_en, featured_home_alt_ka",
    )
    .eq("featured_home", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getFeaturedGroups error:", error);
    throw new Error("Failed to fetch featured groups");
  }

  return (data ?? []) as FeaturedGroup[];
}
