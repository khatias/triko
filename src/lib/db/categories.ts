import { createClient } from "@/utils/supabase/server";

type Locale = "en" | "ka";

type DbCategory = {
  id: string;
  parent_id: string | null;
  position: number;
  name_en: string;
  name_ka: string;
  slug_en: string;
  slug_ka: string;
  status: "draft" | "published" | "archived";
  image_url: string | null;
};

export async function fetchTopCategories(locale: Locale) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,parent_id,position,name_en,name_ka,slug_en,slug_ka,status,image_url"
    )
    .is("parent_id", null)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);

  return (data as DbCategory[]).map((c) => ({
    id: c.id,
    parent_id: c.parent_id,
    position: c.position,
    name: locale === "ka" ? c.name_ka : c.name_en,
    route_slug: c.slug_en, // 👈 always EN for URL
    image_url: c.image_url ?? undefined,
  }));
}

export async function fetchCategoryBySlugEN(slug_en: string, locale: Locale) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,parent_id,position,name_en,name_ka,slug_en,slug_ka,status,image_url"
    )
    .eq("slug_en", decodeURIComponent(slug_en))
    .eq("status", "published")
    .single();

  if (error) return null;

  const c = data as DbCategory;
  return {
    id: c.id,
    parent_id: c.parent_id,
    position: c.position,
    name: locale === "ka" ? c.name_ka : c.name_en,
    route_slug: c.slug_en, // 👈 keep EN for building child URLs too
    image_url: c.image_url ?? undefined,
  };
}

export async function fetchChildCategories(parentId: string, locale: Locale) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id,parent_id,position,name_en,name_ka,slug_en,slug_ka,status,image_url"
    )
    .eq("parent_id", parentId)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (error) throw new Error(`Failed to fetch children: ${error.message}`);

  return (data as DbCategory[]).map((c) => ({
    id: c.id,
    parent_id: c.parent_id,
    position: c.position,
    name: locale === "ka" ? c.name_ka : c.name_en,
    route_slug: c.slug_en, // 👈 EN-only route slug
    image_url: c.image_url ?? undefined,
  }));
}
