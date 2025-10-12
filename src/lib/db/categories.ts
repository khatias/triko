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
type DbCategoryRow = {
  id: string;
  parent_id: string | null;
  position: number;
  name_en: string;
  name_ka: string;
  slug_en: string;
  image_url: string | null;
  status: "draft" | "published" | "archived";
};
export async function fetchNavCategories(locale: Locale) {
  const supabase = await createClient();


  const { data: top, error: topErr } = await supabase
    .from("categories")
    .select("id,parent_id,position,name_en,name_ka,slug_en,image_url,status")
    .is("parent_id", null)
    .eq("status", "published")
    .order("position", { ascending: true });

  if (topErr) throw new Error(topErr.message);
  const tops = (top ?? []) as DbCategoryRow[];
  if (tops.length === 0) return [];
  // console.log(tops);
  const topIds = tops.map((t) => t.id);

  // 2) children of all tops in a single query
  const { data: children, error: childErr } = await supabase
    .from("categories")
    .select("id,parent_id,position,name_en,name_ka,slug_en,image_url,status")
    .in("parent_id", topIds)
    .eq("status", "published")
    .order("parent_id", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });
  // console.log(children);
  if (childErr) throw new Error(childErr.message);
  const kids = (children ?? []) as DbCategoryRow[];

  // 3) group
  const byParent: Record<string, DbCategoryRow[]> = {};
  for (const c of kids) {
    if (!c.parent_id) continue;
    (byParent[c.parent_id] ||= []).push(c);
  }

  // 4) map to menu shape
  return tops.map((t) => ({
    id: t.id,
    name: locale === "ka" ? t.name_ka : t.name_en,
    href: `/${locale}/categories/${encodeURIComponent(t.slug_en)}`, // EN slugs
    children: (byParent[t.id] ?? []).map((ch) => ({
      id: ch.id,
      name: locale === "ka" ? ch.name_ka : ch.name_en,
      href: `/${locale}/categories/${encodeURIComponent(ch.slug_en)}`,
    })),
  }));
}

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
