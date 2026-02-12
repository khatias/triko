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

export const VariantSchema = z.object({
  fina_id: z.number().nullable().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  stock: z.number().nullable().optional(),
  list_price: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  has_discount: z.boolean().nullable().optional(),
});

export const AdminParentProductSchema = z.object({
  parent_code: z.string(),

  group_id: z.number().nullable(),
  group_name: z.string().nullable(),
  group_name_en: z.string().nullable(),
  group_name_ka: z.string().nullable(),

  name: z.string().nullable(),
  currency: z.string().nullable(),
  min_price: z.number().nullable(),
  max_price: z.number().nullable(),
  min_list_price: z.number().nullable(),
  max_list_price: z.number().nullable(),
  total_stock: z.number().nullable(),
  has_discount: z.boolean().nullable(),

  title_ka: z.string().nullable(),
  title_en: z.string().nullable(),
  description_ka: z.string().nullable(),
  description_en: z.string().nullable(),

  // normalize at read-time too
  photos: PhotosSchema.default([]),

  is_published: z.boolean().nullable(),
  has_content: z.boolean().nullable(),
  has_photos: z.boolean().nullable(),
  has_title: z.boolean().nullable(),
  has_description: z.boolean().nullable(),
  is_ready: z.boolean().nullable(),

  variants: z.array(VariantSchema).default([]),
});

export type AdminParentProduct = z.infer<typeof AdminParentProductSchema>;

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
