"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/* ---------------- shared ---------------- */

export type ActionResponse = {
  success: boolean;
  message?: string;
};

function revalidateSiteAndAdmin() {
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/ka", "layout");
  revalidatePath("/en/admin/site");
  revalidatePath("/ka/admin/site");
}

/* ---------------- top banner ---------------- */

const updateBannerSchema = z.object({
  key: z.literal("top_banner"),
  is_active: z.boolean(),
  en_text: z.string().trim().min(1).max(200),
  ka_text: z.string().trim().min(1).max(200),
  cta_href: z.string().trim().min(1).max(300),
  cta_label_en: z.string().trim().min(1).max(40),
  cta_label_ka: z.string().trim().min(1).max(40),
});

export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;

export async function updateTopBanner(
  input: UpdateBannerInput,
): Promise<ActionResponse> {
  const parsed = updateBannerSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("site_banners")
    .update({
      is_active: parsed.is_active,
      en_text: parsed.en_text,
      ka_text: parsed.ka_text,
      cta_href: parsed.cta_href,
      cta_label_en: parsed.cta_label_en,
      cta_label_ka: parsed.cta_label_ka,
      updated_at: new Date().toISOString(),
    })
    .eq("key", parsed.key);

  if (error) throw new Error(error.message);

  revalidateSiteAndAdmin();

  return { success: true };
}

/* ---------------- featured products ---------------- */

const FEATURED_KEY = "home_featured";

const upsertFeaturedProductSchema = z.object({
  key: z.string().trim().min(1).default(FEATURED_KEY),
  parent_code: z.string().trim().min(1).max(80),
  sort_order: z.number().int().min(0).max(100000).default(0),
  is_active: z.boolean().default(true),
});

export type UpsertFeaturedProductInput = z.infer<
  typeof upsertFeaturedProductSchema
>;

export async function upsertFeaturedProduct(
  input: UpsertFeaturedProductInput,
): Promise<ActionResponse> {
  const parsed = upsertFeaturedProductSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("featured_products").upsert(
    {
      key: parsed.key,
      parent_code: parsed.parent_code,
      sort_order: parsed.sort_order,
      is_active: parsed.is_active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key,parent_code" },
  );

  if (error) {
    if (error.code === "23505") {
      throw new Error("This product is already featured.");
    }
    throw new Error(error.message);
  }

  revalidateSiteAndAdmin();

  return { success: true };
}

const deleteFeaturedProductSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteFeaturedProductInput = z.infer<
  typeof deleteFeaturedProductSchema
>;

export async function deleteFeaturedProduct(
  input: DeleteFeaturedProductInput,
): Promise<ActionResponse> {
  const parsed = deleteFeaturedProductSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("featured_products")
    .delete()
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);

  revalidateSiteAndAdmin();

  return { success: true };
}

const updateFeaturedProductSchema = z.object({
  id: z.string().uuid(),
  sort_order: z.number().int().min(0).max(100000),
  is_active: z.boolean(),
});

export type UpdateFeaturedProductInput = z.infer<
  typeof updateFeaturedProductSchema
>;

export async function updateFeaturedProduct(
  input: UpdateFeaturedProductInput,
): Promise<ActionResponse> {
  const parsed = updateFeaturedProductSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase
    .from("featured_products")
    .update({
      sort_order: parsed.sort_order,
      is_active: parsed.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.id);

  if (error) throw new Error(error.message);

  revalidateSiteAndAdmin();

  return { success: true };
}