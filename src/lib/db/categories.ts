import { createClient } from "@/utils/supabase/server"

type Locale = "en" | "ka"

type DbCategory = {
  id: string;
  parent_id: string | null;
  position: number;
  name_en: string;
  name_ka: string;
  slug_en: string;
  slug_ka: string;
  status: "draft" | "published";

}
export async function  fetchTopCategories(locale: Locale) {
  const supabase = await createClient()
  const {data,error} = await supabase
  .from("categories")
  .select(`id, parent_id, position, status, name_${locale}, slug_${locale}`)
  .is("parent_id", null)
  .eq("status", "published")
  .order("position", { ascending: true })

  if (error) {
    console.log("Error fetching categories:", error)
    return []
  }

  if (!data) {
    return []
  }

  return (data as DbCategory[]).map((c) => ({
    id: c.id,
    parent_id: c.parent_id,
    position: c.position,
    name: locale === "ka" ? c.name_ka : c.name_en,
    slug: locale === "ka" ? c.slug_ka : c.slug_en,
  }));
}