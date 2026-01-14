export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type ProductRow = {
  id: string;
  status: ProductStatus;
  position: number | null;
  name_en: string;
  name_ka: string;
  description_en: string | null;
  description_ka: string | null;
  primary_image_url: string | null;
  price_cents: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
};
