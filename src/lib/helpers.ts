import { CatalogGroupedProductCard, Variant } from "./db/products";
export type Locale = "en" | "ka";

export const RESERVED_TOP_LEVEL_SLUGS = new Set([
  "api",
  "auth",
  "confirm",
  "forgot-password",
  "reset-password",
  "login",
  "signup",
  "profile",
  "account",
  "address",
  "orders",
  "exchange-policy",
  "privacy",
  "shipping-policy",
  "terms",
  "admin",
  "shop",
  "products",
  "product",
  "cart",
  "checkout",
  "aboutUs",
  "contact",
]);

export function displayTitle(
  p: Partial<CatalogGroupedProductCard>,
  locale: Locale,
) {
  const en = (p.title_en ?? "").trim();
  const ka = (p.title_ka ?? "").trim();
  const name = (p.name ?? "").trim();

  if (locale === "ka") return ka || en || name || "Untitled Piece";
  return en || ka || name || "Untitled Piece";
}

export function displayDescription(
  p: Partial<CatalogGroupedProductCard>,
  locale: Locale,
) {
  const en = (p.description_en ?? "").trim();
  const ka = (p.description_ka ?? "").trim();

  if (locale === "ka") return ka || en || "No description available";
  return en || ka || "No description available";
}
//from product
export function displayGroupName(
  p: Partial<CatalogGroupedProductCard>,
  locale: Locale,
) {
  const en = (p.group_name_en ?? "").trim();
  const ka = (p.group_name_ka ?? "").trim();

  if (locale === "ka") return ka || en || "Collection";
  return en || ka || "Collection";
}

//from group
export function pickGroupName(
  g: {
    name_en?: string | null;
    name_ka?: string | null;
    fina_name?: string | null;
  },
  locale: Locale,
) {
  const en = (g.name_en ?? "").trim();
  const ka = (g.name_ka ?? "").trim();
  const fina = (g.fina_name ?? "").trim();

  if (locale === "ka") return ka || en || fina || "Collection";
  return en || ka || fina || "Collection";
}
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
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
type PhotoObject = { url?: unknown; sort?: unknown; is_primary?: unknown };
type PhotoUrlsObject = { urls?: unknown };

export function isPhotoObject(v: unknown): v is PhotoObject {
  return isRecord(v) && ("url" in v || "sort" in v || "is_primary" in v);
}

export function isPhotoUrlsObject(v: unknown): v is PhotoUrlsObject {
  return isRecord(v) && "urls" in v;
}

export function normalizeUrl(u: unknown): string | null {
  const s = typeof u === "string" ? u.trim() : "";
  return s ? s : null;
}
export function getPhotoUrls(photos: unknown): string[] {
  if (!photos) return [];

  // single string
  const single = normalizeUrl(photos);
  if (single) return [single];

  if (!Array.isArray(photos)) return [];

  const collected: { url: string; sort: number; isPrimary: boolean }[] = [];

  for (const item of photos) {
    // "https://..."
    const direct = normalizeUrl(item);
    if (direct) {
      collected.push({ url: direct, sort: 9999, isPrimary: false });
      continue;
    }

    // { urls: ["...", "..."] }
    if (isPhotoUrlsObject(item)) {
      const urls = item.urls;
      if (Array.isArray(urls)) {
        for (const u of urls) {
          const nu = normalizeUrl(u);
          if (nu) collected.push({ url: nu, sort: 9999, isPrimary: false });
        }
      }
      continue;
    }

    // { url, sort, is_primary }
    if (isPhotoObject(item)) {
      const url = normalizeUrl(item.url);
      if (!url) continue;

      const sort = typeof item.sort === "number" ? item.sort : 9999;
      const isPrimary = item.is_primary === true;

      collected.push({ url, sort, isPrimary });
    }
  }

  collected.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sort - b.sort;
  });

  return Array.from(new Set(collected.map((x) => x.url)));
}

export function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function shortId(id: string) {
  return id.slice(0, 8);
}
