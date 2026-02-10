"use server";

import { requireAdmin } from "@/utils/auth/requireAdmin";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message?: string;
};

export type UpdateInput = {
  locale: string;
  groupId: number;
  name_en: string;
  name_ka: string;
  slug_en: string;
  sort_order: number | null;
  is_visible: boolean;
};

export async function upsertGroupSettingsAction(
  input: UpdateInput,
): Promise<ActionResponse> {
  const { locale, groupId } = input;

  try {
    const { supabase } = await requireAdmin(locale);

    const payload = {
      group_id: groupId,
      name_en: input.name_en || null,
      name_ka: input.name_ka || null,
      slug_en: input.slug_en ? input.slug_en : null,
      sort_order: input.sort_order,
      is_visible: input.is_visible,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("shop_group_settings")
      .upsert(payload, { onConflict: "group_id" });

    if (error) {
      if (error.code === "23505") {
        return {
          success: false,
          message: "This slug is already used by another group.",
        };
      }

      if (
        error.code === "23514" ||
        (error.message ?? "").includes("slug_en_format")
      ) {
        return {
          success: false,
          message:
            "Slug format is invalid. Use kebab-case: lowercase letters/numbers with dashes.",
        };
      }

      return {
        success: false,
        message: error.message || "Database error. Please try again.",
      };
    }

    revalidatePath(`/${locale}/admin/groups`);

    revalidatePath(`/${locale}`);
    return { success: true };
  } catch {
    return { success: false, message: "Connection failed." };
  }
}
