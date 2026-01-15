export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type ProductRow = {
  id: string;
  slug: string;
  status: ProductStatus;
  position: number | null;
  name_en: string;
  name_ka: string;
  description_en: string | null;
  description_ka: string | null;
  primary_image_url: string | null;
  primary_image_path: string | null;
  price_cents: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImageRow = {
  product_id: string;
  url: string;
  storage_path: string;
  position: number | null;
};

export type ProductColorImageRow = {
  product_id: string;
  color_id: string;
  url: string;
  storage_path: string;
  position: number | null;
};

export type VariantRow = {
  id: string;
  color_id: string;
  size_id: string;
  color: string | null;
  size: string | null;
  is_active: boolean | null;
};

export type ColorMeta = {
  id: string;
  code: string;
  name_en: string | null;
  name_ka: string | null;
  hex: string | null;
};

export type CategoryJoinRow = {
  position: number | null;
  categories: { id: string; name_en: string | null; name_ka: string | null } | null;
};