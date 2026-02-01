import { createClient } from "@/utils/supabase/server";

export type CatalogGroupedProductCard = {
  parent_code: string;
  name: string;
  title_ka: string | null;
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;
  group_name_ka: string | null;
  group_name_en: string | null;
  currency: string | null;
  min_price: number | null;
  max_price: number | null;
  photos: unknown | null;
  variants?: Variant[] | null;
};

export type Variant = {
  fina_id: number;
  code: string | null;
  name: string;
  size: string | null;
  price: number | null;
  currency: string | null;
  stock: number | null;
};

export type CatalogPageResult = {
  items: CatalogGroupedProductCard[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type GetCatalogProductsGroupedArgs = {
  page?: number;
  pageSize?: number;
};

export type CatalogProductDetail = {
  parent_code: string;
  group_id: number | null;
  group_name: string | null;

  name: string;
  title_ka: string | null;
  title_en: string | null;

  description_ka: string | null;
  description_en: string | null;

  photos: unknown | null;
  currency: string | null;
  min_price: number | null;
  max_price: number | null;

  total_stock: number | null;
  variants: Variant[];
};

export async function getCatalogProductsGrouped(
  args: GetCatalogProductsGroupedArgs = {},
): Promise<CatalogPageResult> {
  const supabase = await createClient();

  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, args.pageSize ?? 24));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("shop_customer_parent_test_view")
    .select(
      `
      parent_code,
      title_ka,
      title_en,
      photos,
      name,
      currency,
      min_price,
      max_price,
      variants
    `,
      { count: "exact" },
    )
    .order("parent_code", { ascending: true })
    .range(from, to);

  if (error) {
    console.error("getCatalogProductsGrouped error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to fetch grouped catalog products");
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: (data ?? []) as CatalogGroupedProductCard[],
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getCatalogProductDetail(
  parentCode: string,
): Promise<CatalogProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_customer_parent_test_view")
    .select(
      `
      parent_code,
      group_id,
      group_name,
      name,
      title_ka,
      title_en,
     description_ka,
      description_en,
      photos,
      currency,
      min_price,
      max_price,
      total_stock,
      variants
    `,
    )
    .eq("parent_code", parentCode)
    .maybeSingle();

  if (error) {
    console.error("getCatalogProductDetail error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to fetch product detail");
  }

  return (data ?? null) as CatalogProductDetail | null;
}
