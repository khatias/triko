"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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

export async function updateTopBanner(input: UpdateBannerInput) {
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
    })
    .eq("key", parsed.key);

  if (error) throw new Error(error.message);

  // Revalidate both locales and admin page route (with locale)
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  revalidatePath("/ka", "layout");
  revalidatePath("/en/admin/site");
  revalidatePath("/ka/admin/site");
}
