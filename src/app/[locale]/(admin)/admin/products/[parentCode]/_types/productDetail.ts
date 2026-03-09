// src/app/[locale]/admin/products/[parentCode]/_types/productDetail.ts
import { z } from "zod";

/** ---------- Helpers ---------- */

const HttpUrl = z
  .string()
  .trim()
  .url()
  .refine(
    (u) => u.startsWith("https://") || u.startsWith("http://"),
    "URL must start with http(s)",
  );

/**
 * number coercion:
 * - accepts number
 * - accepts numeric strings like "195" or "195.00"
 * - treats "" as null
 * - keeps null as null
 */
const CoerceNumber = z.preprocess((v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}, z.number().nullable());

const CoerceInt = z.preprocess((v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}, z.number().int().nullable());

const CoerceBool = z.preprocess((v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return Boolean(v);
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "t" || s === "1" || s === "yes") return true;
    if (s === "false" || s === "f" || s === "0" || s === "no") return false;
  }
  return null;
}, z.boolean().nullable());

const CoerceString = z.preprocess((v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}, z.string().nullable());

/** ---------- Photos ---------- */

/**
 * Accept legacy string OR object, then normalize to object.
 */
export const PhotoSchema = z
  .union([
    HttpUrl,
    z.object({
      url: HttpUrl,
      sort: z.number().int().nonnegative().optional(),
      is_primary: z.boolean().optional(),
    }),
  ])
  .transform((v) => {
    if (typeof v === "string") return { url: v, sort: 0, is_primary: false };
    return {
      url: v.url,
      sort: v.sort ?? 0,
      is_primary: v.is_primary ?? false,
    };
  });

export type Photo = z.infer<typeof PhotoSchema>;

/**
 * Strict Photos array:
 * - max 12
 * - trim + dedupe by url
 * - sort normalized to 0..n-1
 * - exactly one primary if there is at least 1 photo
 */
export const PhotosSchema = z
  .array(PhotoSchema)
  .max(12, "Max 12 photos")
  .transform((arr) => {
    const seen = new Set<string>();

    const uniq = arr
      .map((p) => ({ ...p, url: p.url.trim() }))
      .filter((p) => {
        if (!p.url) return false;
        if (seen.has(p.url)) return false;
        seen.add(p.url);
        return true;
      });

    uniq.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    let primaryIdx = uniq.findIndex((p) => p.is_primary);
    if (uniq.length > 0 && primaryIdx === -1) primaryIdx = 0;

    return uniq.map((p, i) => ({
      url: p.url,
      sort: i,
      is_primary: i === primaryIdx,
    }));
  });

/** ---------- Variants ---------- */

export const VariantSchema = z.object({
  fina_id: CoerceInt.optional(),
  code: CoerceString.optional(),
  name: CoerceString.optional(),
  size: CoerceString.optional(),
  currency: CoerceString.optional(),
  stock: CoerceInt.optional(),
  list_price: CoerceNumber.optional(),
  price: CoerceNumber.optional(),
  has_discount: CoerceBool.optional(),
});

/** ---------- Parent product detail ---------- */
/**
 * IMPORTANT:
 * bundle detail view might not return all old fields.
 * We keep your editor stable by providing defaults.
 */
export const AdminParentProductSchema = z.object({
  parent_code: z.string(),

  // sometimes missing on bundle rows -> default null
  group_id: CoerceInt.optional().default(null),
  group_name: CoerceString.optional().default(null),
  group_name_en: CoerceString.optional().default(null),
  group_name_ka: CoerceString.optional().default(null),

  name: CoerceString.optional().default(null),

  // old detail view had these; bundles may not -> defaults
  currency: CoerceString.optional().default("GEL"),
  min_price: CoerceNumber.optional().default(null),
  max_price: CoerceNumber.optional().default(null),
  min_list_price: CoerceNumber.optional().default(null),
  max_list_price: CoerceNumber.optional().default(null),
  total_stock: CoerceInt.optional().default(0),
  has_discount: CoerceBool.optional().default(false),

  title_ka: CoerceString.optional().default(null),
  title_en: CoerceString.optional().default(null),
  description_ka: CoerceString.optional().default(null),
  description_en: CoerceString.optional().default(null),

  // normalize at read-time too
  photos: PhotosSchema.default([]),

  is_published: CoerceBool.optional().default(false),

  // these flags may not exist on bundle detail view -> defaults
  has_content: CoerceBool.optional().default(false),
  has_photos: CoerceBool.optional().default(false),
  has_title: CoerceBool.optional().default(false),
  has_description: CoerceBool.optional().default(false),
  is_ready: CoerceBool.optional().default(false),

  variants: z.array(VariantSchema).default([]),

  // optional: helpful in UI
  is_bundle: z.preprocess((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return Boolean(v);
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      return s === "true" || s === "t" || s === "1" || s === "yes";
    }
    return false;
  }, z.boolean()).default(false),
});

export type AdminParentProduct = z.infer<typeof AdminParentProductSchema>;

/** ---------- Save content input ---------- */

export const SaveContentInputSchema = z.object({
  parentCode: z.string().trim().min(1),

  // allow null to clear; empty string becomes invalid if present
  title_ka: z.string().trim().min(1).nullable().optional(),
  title_en: z.string().trim().min(1).nullable().optional(),
  description_ka: z.string().trim().min(1).nullable().optional(),
  description_en: z.string().trim().min(1).nullable().optional(),

  photos: PhotosSchema.default([]),
});

export type SaveContentInput = z.infer<typeof SaveContentInputSchema>;

/**
 * Strict ready rules (used for UI + can be used server-side)
 */
export function computeReadyFromDraft(d: {
  title_ka: string;
  title_en: string;
  description_ka: string;
  description_en: string;
  photos: Photo[];
}) {
  const hasPhotos = (d.photos ?? []).length > 0;
  const hasTitleKa = d.title_ka.trim().length > 0;
  const hasTitleEn = d.title_en.trim().length > 0;
  const hasDescKa = d.description_ka.trim().length > 0;
  const hasDescEn = d.description_en.trim().length > 0;
  return hasPhotos && hasTitleKa && hasTitleEn && hasDescKa && hasDescEn;
}