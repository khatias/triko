import "server-only";
import { requireAdmin } from "@/utils/auth/requireAdmin";

export async function previewBundleSizes(
  locale: string,
  topParent: string,
  bottomParent: string,
) {
  const { supabase } = await requireAdmin(locale);
  const { data: top, error: e1 } = await supabase
    .from("shop_admin_parent_sizes_v1")
    .select("size_code")
    .eq("parent_code", topParent);

  if (e1) throw new Error(e1.message);

  const { data: bottom, error: e2 } = await supabase
    .from("shop_admin_parent_sizes_v1")
    .select("size_code")
    .eq("parent_code", bottomParent);

  if (e2) throw new Error(e2.message);

  const a = new Set((top ?? []).map((x) => x.size_code).filter(Boolean));
  const b = new Set((bottom ?? []).map((x) => x.size_code).filter(Boolean));

  const intersection = [...a].filter((s) => b.has(s)).sort();
  return intersection;
}