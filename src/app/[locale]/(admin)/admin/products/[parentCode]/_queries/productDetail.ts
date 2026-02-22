// src/app/[locale]/admin/products/[parentCode]/_queries/productDetail.ts
import "server-only";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { AdminParentProductSchema, type AdminParentProduct } from "../_types/productDetail";

export async function fetchAdminParentProduct(
  locale: string,
  parentCode: string,
): Promise<AdminParentProduct | null> {
  const { supabase } = await requireAdmin(locale);

  const { data, error } = await supabase
    .from("shop_catalog_admin_product_detail_view_v1") // ✅ აქედან!
    .select("*")
    .eq("parent_code", parentCode)
    .maybeSingle();

  if (error) {
    console.error("[fetchAdminParentProduct] error:", error);
    return null;
  }
  if (!data) return null;

  const rawPhotos = (data as { photos?: unknown }).photos;
  const normalized = { ...data, photos: Array.isArray(rawPhotos) ? rawPhotos : [] };

  const parsed = AdminParentProductSchema.safeParse(normalized);
  if (!parsed.success) {
    console.error("[fetchAdminParentProduct] schema error:", parsed.error);
    return null;
  }

  return parsed.data;
}