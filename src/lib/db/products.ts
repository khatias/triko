import { createClient } from "@/utils/supabase/server";

/* =========================
   Types
========================= */

export type Variant = {
  fina_id: number | null;
  top_fina_id?: number | null;
  bottom_fina_id?: number | null;

  code: string | null;
  name: string;
  size: string | null;

  price: number | null;
  list_price: number | null;
  has_discount: boolean | null;
  currency: string | null;
  stock: number | null;
};

export type CatalogGroupedProductCard = {
  parent_code: string;
  name: string;

  title_ka: string | null;
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;

  photos: unknown | null;

  currency: string | null;

  min_price: number | null;
  max_price: number | null;

  min_list_price: number | null;
  max_list_price: number | null;

  has_discount: boolean | null;

  total_stock?: number | null;

  group_id?: number | null;
  group_name?: string | null;
  group_name_en?: string | null;
  group_name_ka?: string | null;

  variants?: Variant[] | null;
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

  // ✅ supports parent + descendants
  groupId?: number | null;
  groupIds?: number[] | null;

  q?: string | null;
};

export type CatalogProductDetail = {
  parent_code: string;

  group_id: number | null;
  group_name: string | null;
  group_name_en: string | null;
  group_name_ka: string | null;

  name: string;

  title_ka: string | null;
  title_en: string | null;
  description_ka: string | null;
  description_en: string | null;

  photos: unknown | null;

  currency: string | null;

  min_price: number | null;
  max_price: number | null;

  min_list_price: number | null;
  max_list_price: number | null;

  has_discount: boolean | null;

  total_stock: number | null;

  variants: Variant[];
};

/* =========================
   Helpers
========================= */

function normalizeGroupIds(args: GetCatalogProductsGroupedArgs): number[] {
  const out: number[] = [];

  if (Array.isArray(args.groupIds)) {
    for (const x of args.groupIds) {
      if (typeof x === "number" && Number.isFinite(x)) out.push(x);
    }
  }

  if (typeof args.groupId === "number" && Number.isFinite(args.groupId)) {
    out.push(args.groupId);
  }

  return Array.from(new Set(out));
}

function uniqueKeepOrder(list: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    if (!x) continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

/* =========================
   Queries
========================= */

export async function getCatalogProductsGrouped(
  args: GetCatalogProductsGroupedArgs = {},
): Promise<CatalogPageResult> {
  const supabase = await createClient();

  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, args.pageSize ?? 24));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("shop_catalog_parent_view")
    .select(
      `
        parent_code,
        name,
        title_ka,
        title_en,
        description_ka,
        description_en,
        photos,
        currency,
        min_price,
        max_price,
        min_list_price,
        max_list_price,
        has_discount,
        variants,
        group_id,
        group_name,
        group_name_en,
        group_name_ka
      `,
      { count: "exact" },
    )
    .order("parent_code", { ascending: true });

  // ✅ FIX: groupId OR groupIds
  const gids = normalizeGroupIds(args);
  if (gids.length === 1) {
    query = query.eq("group_id", gids[0]);
  } else if (gids.length > 1) {
    query = query.in("group_id", gids);
  }

  const rawQ = (args.q ?? "").trim();
  if (rawQ) {
    const q = rawQ
      .replace(/[%_]/g, "\\$&")
      .replace(/,/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 80);

    query = query.or(
      [
        `name.ilike.%${q}%`,
        `title_en.ilike.%${q}%`,
        `title_ka.ilike.%${q}%`,
        `group_name.ilike.%${q}%`,
        `group_name_en.ilike.%${q}%`,
        `group_name_ka.ilike.%${q}%`,
        `parent_code.ilike.%${q}%`,
      ].join(","),
    );
  }

  const { data, error, count } = await query.range(from, to);

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
    .from("shop_catalog_parent_view")
    .select(
      `
        parent_code,
        group_id,
        group_name,
        group_name_en,
        group_name_ka,
        name,
        title_ka,
        title_en,
        description_ka,
        description_en,
        photos,
        currency,
        min_price,
        max_price,
        min_list_price,
        max_list_price,
        has_discount,
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

export async function getProductsByParentCodes(
  parentCodes: string[],
): Promise<CatalogGroupedProductCard[]> {
  const codes = uniqueKeepOrder(parentCodes);
  if (codes.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_catalog_parent_view")
    .select(
      `
      parent_code,
      name,
      title_ka,
      title_en,
      description_ka,
      description_en,
      photos,
      currency,
      min_price,
      max_price,
      min_list_price,
      max_list_price,
      has_discount,
      group_id,
      group_name,
      group_name_en,
      group_name_ka,
      total_stock,
      variants
    `,
    )
    .in("parent_code", codes);

  if (error) {
    console.error("getProductsByParentCodes error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Failed to fetch products by parent codes");
  }

  const rows = (data ?? []) as CatalogGroupedProductCard[];

  const map = new Map<string, CatalogGroupedProductCard>();
  for (const r of rows) {
    if (!map.has(r.parent_code)) map.set(r.parent_code, r);
  }

  return codes
    .map((c) => map.get(c))
    .filter(Boolean) as CatalogGroupedProductCard[];
}