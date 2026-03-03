import "server-only";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import {
  AdminProductListRowSchema,
  type AdminProductListRow,
} from "../types/admin-products";

export async function fetchAdminProductsList(
  locale: string,
): Promise<AdminProductListRow[]> {
  const { supabase } = await requireAdmin(locale);

  const { data, error } = await supabase
    .from("shop_catalog_admin_product_detail_mv_v1")
    .select(
      [
        "parent_code",
        "name",
        "group_name",
        "group_name_en",
        "group_name_ka",
        "total_stock",
        "min_price",
        "max_price",
        "is_published",
        "has_content",
        "has_photos",
        "has_title",
        "has_description",
        "is_ready",
      ].join(","),
    )
    .order("group_name", { ascending: true })
    .order("parent_code", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = Array.isArray(data) ? data : [];
  return rows.map((r) => AdminProductListRowSchema.parse(r));
}
