"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";

const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

const Schema = z.object({
  status: z.enum(PRODUCT_STATUSES),
  name_en: z.string().trim().min(1, "Name EN is required"),
  name_ka: z.string().trim().min(1, "Name KA is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Use letters, numbers, and hyphens only")
    .transform((s) => s.toLowerCase()),


  price_cents: z
    .string()
    .trim()
    .min(1, "Price cents is required")
    .refine((s) => /^-?\d+$/.test(s), "Enter a whole number (cents)")
    .transform((s) => Number(s))
    .refine((n) => Number.isSafeInteger(n), "Invalid number")
    .refine((n) => n > 0, "Price must be greater than 0"),

  description_en: z.string().trim().optional(),
  description_ka: z.string().trim().optional(),
});

type FieldErrors = Record<string, string[]>;

export type UpdateProductState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

function fdString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export async function updateProductAction(
  locale: string,
  id: string,
  _prev: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  await requireAdmin(locale);
  const db = createAdminClient();


  const values: Record<string, string> = {
    status: fdString(formData, "status"),
    name_en: fdString(formData, "name_en"),
    name_ka: fdString(formData, "name_ka"),
    slug: fdString(formData, "slug"),
    price_cents: fdString(formData, "price_cents"),
    description_en: fdString(formData, "description_en"),
    description_ka: fdString(formData, "description_ka"),
  };

  const parsed = Schema.safeParse(values);

  if (!parsed.success) {
    const fe: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      (fe[k] ??= []).push(issue.message);
    }
    const firstMsg = parsed.error.issues[0]?.message;
    return {
      ok: false,
      message: firstMsg ?? "Please fix the form errors.",
      fieldErrors: fe,
      values,
    };
  }

  const v = parsed.data;

  const { error } = await db
    .from("products")
    .update({
      status: v.status,
      name_en: v.name_en,
      name_ka: v.name_ka,
      slug: v.slug,
      price_cents: v.price_cents,
      description_en: v.description_en?.trim() ? v.description_en.trim() : null,
      description_ka: v.description_ka?.trim() ? v.description_ka.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message, values };
  }

  revalidatePath(`/${locale}/admin/products`);
  revalidatePath(`/${locale}/admin/products/${id}`);
  revalidatePath(`/${locale}/admin/products/${id}/edit`);

  return { ok: true, message: "Saved." };
}
