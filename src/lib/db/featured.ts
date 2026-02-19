import { createClient } from "@/utils/supabase/server";

export async function getFeaturedParentCodes(
  key: string,
  limit = 12,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("featured_products")
    .select("parent_code,sort_order")
    .eq("key", key)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getFeaturedParentCodes error:", error);
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of data ?? []) {
    const code = row.parent_code;
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}
