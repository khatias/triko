// src/lib/validation/product.ts
import { z } from "zod";

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const NonEmpty = (msg: string) => z.string().trim().min(1, msg);

const PriceCentsString = z
  .string()
  .trim()
  .min(1, "Price is required")
  .regex(/^\d+$/, "Digits only (0-9)")
  .refine((s) => s.length <= 9, "Price is too large"); // optional guard

const Slug = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .regex(/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/, "Use letters, numbers, and hyphens only");

export const CreateProductFormSchema = z.object({
  status: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.enum(PRODUCT_STATUSES)
    )
    .default("draft"),

  name_en: NonEmpty("Name EN required").min(2, "Name EN must be at least 2 characters"),
  name_ka: NonEmpty("Name KA required").min(2, "Name KA must be at least 2 characters"),

  slug: Slug,

  price_cents: PriceCentsString,

  description_en: z.string().trim().max(20000, "Too long").optional(),
  description_ka: z.string().trim().max(20000, "Too long").optional(),

  category_ids: z.array(z.uuid()).min(1, "Pick at least 1 category"),
  color_ids: z.array(z.uuid()).min(1, "Pick at least 1 color"),
  size_ids: z.array(z.uuid()).min(1, "Pick at least 1 size"),
});

export type CreateProductFormInput = z.infer<typeof CreateProductFormSchema>;

// Server-safe conversion (still “shared”, still pure)
function parsePriceCents(s: string): number {
  const n = Number.parseInt(s, 10);
  if (!Number.isSafeInteger(n) || n < 0) return 0; // schema prevents this anyway
  return n;
}

export function toInsertProduct(input: CreateProductFormInput): {
  status: ProductStatus;
  name_en: string;
  name_ka: string;
  slug: string;
  price_cents: number;
  description_en: string | null;
  description_ka: string | null;
} {
  const descEn = input.description_en?.trim() ?? "";
  const descKa = input.description_ka?.trim() ?? "";

  return {
    status: input.status,
    name_en: input.name_en.trim(),
    name_ka: input.name_ka.trim(),
    slug: input.slug.trim().toLowerCase(),
    price_cents: parsePriceCents(input.price_cents),
    description_en: descEn === "" ? null : descEn,
    description_ka: descKa === "" ? null : descKa,
  };
}
