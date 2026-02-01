import { CatalogGroupedProductCard, Variant } from "./db/products";

export const displayTitle = (p: Partial<CatalogGroupedProductCard>) =>
  p.title_en || p.title_ka || p.name || "Untitled Piece";

export function formatPrice(val: number | null, currency: string | null) {
  if (val == null) return null;
  const symbol = currency === "GEL" ? "₾" : (currency ?? "$");
  return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function getFirstPhotoUrl(
  photos:
    | string
    | string[]
    | { url: string }
    | { url: string }[]
    | null
    | undefined,
): string | null {
  if (!photos) return null;
  if (typeof photos === "string") return photos;
  if (Array.isArray(photos)) {
    const first = photos[0];
    return typeof first === "string" ? first : first?.url || null;
  }
  return photos.url || null;
}

export function clampPositiveInt(value: unknown, fallback: number) {
  const n = typeof value === "string" ? Number(value) : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}
export function normalizeSize(input: unknown): string | null {
  if (typeof input !== "string") return null;

  let s = input.normalize("NFKC").trim().toUpperCase();
  s = s.replace(/\s+/g, " ");

  // fix "X L" look
  s = s.replace(/\bX\s+L\b/g, "XL");
  s = s.replace(/\bX\s+XL\b/g, "XXL");
  s = s.replace(/\bX\s+XXL\b/g, "XXXL");

  return s.length ? s : null;
}

type SizeRow = {
  label: string;
  inStock: boolean;
  variant: Variant | null;
};

export function buildSizes(variants: Variant[] | null | undefined): SizeRow[] {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  const map = new Map<string, Variant[]>();
  for (const v of variants) {
    const s = normalizeSize(v.size);
    if (!s) continue;
    const arr = map.get(s) ?? [];
    arr.push(v);
    map.set(s, arr);
  }

  const order = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "ST"];
  const keys = Array.from(map.keys()).sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return keys.map((k) => {
    const list = map.get(k) ?? [];
    const inStockVariant =
      list.find((x) => (typeof x.stock === "number" ? x.stock : 0) > 0) ?? null;

    const chosen = inStockVariant ?? list[0] ?? null;
    const inStock = list.some(
      (x) => (typeof x.stock === "number" ? x.stock : 0) > 0,
    );

    return { label: k, inStock, variant: chosen };
  });
}
