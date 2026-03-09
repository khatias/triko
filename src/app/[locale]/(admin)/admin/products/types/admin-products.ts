import { z } from "zod";

export const AdminProductListRowSchema = z.object({
  parent_code: z.string(),
  name: z.string().nullable(),
  group_name: z.string().nullable(),
  group_name_en: z.string().nullable(),
  group_name_ka: z.string().nullable(),

  total_stock: z.number().nullable(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),

  is_published: z.boolean().nullable(),
  has_content: z.boolean().nullable(),
  has_photos: z.boolean().nullable(),
  has_title: z.boolean().nullable(),
  has_description: z.boolean().nullable(),
  is_ready: z.boolean().nullable(),
});

export type AdminProductListRow = z.infer<typeof AdminProductListRowSchema>;

export type ProductsTab = "inbox" | "hidden" | "live";

export function coerceTab(input: unknown): ProductsTab {
  if (input === "hidden" || input === "live" || input === "inbox") return input;
  return "inbox";
}

export function coerceQ(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

export function computeStatus(r: AdminProductListRow) {
  const published = Boolean(r.is_published);
  const ready = Boolean(r.is_ready);
  const hasContent = Boolean(r.has_content);

  if (!hasContent || !ready) return "needs_work" as const;
  if (published) return "live" as const;
  return "hidden" as const;
}

export type StockFilter = "all" | "in" | "out";
export type DiscountFilter = "all" | "yes" | "no";
export type MissingFilter = "all" | "content" | "photos" | "title" | "desc";
export type SortKey = "group" | "stock_desc" | "price_asc" | "price_desc";

export type ProductsFiltersState = {
  tab: ProductsTab;
  q: string;
  group: string;
  stock: StockFilter;
  discount: DiscountFilter;
  missing: MissingFilter;
  sort: SortKey;
};

export function coerceStr(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

export function coerceStock(input: unknown): StockFilter {
  return input === "in" || input === "out" ? input : "all";
}

export function coerceDiscount(input: unknown): DiscountFilter {
  return input === "yes" || input === "no" ? input : "all";
}

export function coerceMissing(input: unknown): MissingFilter {
  return input === "content" ||
    input === "photos" ||
    input === "title" ||
    input === "desc"
    ? input
    : "all";
}

export function coerceSort(input: unknown): SortKey {
  return input === "stock_desc" ||
    input === "price_asc" ||
    input === "price_desc"
    ? input
    : "group";
}



export function getGroupLabel(
  r: {
    group_name_en?: string | null;
    group_name_ka?: string | null;
    group?: string | null; // fallback
    group_slug?: string | null; // fallback
  },
  locale: string,
) {
  const isKa = locale === "ka";

  const ka = (r.group_name_ka ?? "").trim();
  const en = (r.group_name_en ?? "").trim();

  if (isKa) return ka || en || r.group || r.group_slug || "—";
  return en || ka || r.group || r.group_slug || "—";
}
