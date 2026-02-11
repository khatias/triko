// src/app/[locale]/admin/products/[parentCode]/_queries/productDetail.ts
import "server-only";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import {
  AdminParentProductSchema,
  type AdminParentProduct,
} from "../_types/productDetail";

export async function fetchAdminParentProduct(
  locale: string,
  parentCode: string,
): Promise<AdminParentProduct | null> {
  const { supabase } = await requireAdmin(locale);

  const { data, error } = await supabase
    .from("shop_catalog_admin_parent_view")
    .select("*")
    .eq("parent_code", parentCode)
    .maybeSingle();

  if (error) {
    // In production, do NOT crash the whole page for a view error
    // Return null so page can show notFound (or you can render an error state)
    console.error("[fetchAdminParentProduct] error:", error);
    return null;
  }
  if (!data) return null;

  // photos might come as unknown jsonb
  const rawPhotos = (data as { photos?: unknown }).photos;

  const normalized = {
    ...data,
    photos: Array.isArray(rawPhotos) ? rawPhotos : [],
  };

  const parsed = AdminParentProductSchema.safeParse(normalized);
  if (!parsed.success) {
    console.error("[fetchAdminParentProduct] schema error:", parsed.error);
    return null;
  }

  return parsed.data;
}
