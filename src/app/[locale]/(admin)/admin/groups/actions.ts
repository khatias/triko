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

  // ✅ new
  is_active: boolean;

  featured_home: boolean;
  featured_home_order: number | null;
  featured_home_image_path: string;
  featured_home_alt_en: string;
  featured_home_alt_ka: string;
};

const BUCKET = "groups";

function trimOrNull(v: string | null | undefined) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

function safeExtFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

export async function uploadFeaturedGroupImageAction(formData: FormData) {
  try {
    const locale = String(formData.get("locale") ?? "");
    const groupIdRaw = String(formData.get("groupId") ?? "");
    const file = formData.get("file") as File | null;

    if (!locale) return { success: false as const, message: "Missing locale" };
    if (!groupIdRaw)
      return { success: false as const, message: "Missing groupId" };
    if (!file) return { success: false as const, message: "Missing file" };

    const groupId = Number(groupIdRaw);
    if (!Number.isFinite(groupId)) {
      return { success: false as const, message: "Invalid groupId" };
    }

    const ext = safeExtFromMime(file.type);
    if (!ext) {
      return { success: false as const, message: "Only png, jpg, webp allowed" };
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return { success: false as const, message: "Max file size is 5MB" };
    }

    const { supabase } = await requireAdmin(locale);

    const path = `featured-home/${groupId}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: true,
      cacheControl: "3600",
    });

    if (error) return { success: false as const, message: error.message };

    return { success: true as const, path };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { success: false as const, message };
  }
}

export async function upsertGroupSettingsAction(
  input: UpdateInput,
): Promise<ActionResponse> {
  const { locale, groupId } = input;

  try {
    const { supabase } = await requireAdmin(locale);

    const payload = {
      group_id: groupId,

      name_en: trimOrNull(input.name_en),
      name_ka: trimOrNull(input.name_ka),
      slug_en: trimOrNull(input.slug_en),
      sort_order: input.sort_order,
      is_visible: input.is_visible,

      is_active: !!input.is_active,

      featured_home: !!input.featured_home,
      featured_home_order: input.featured_home_order,
      featured_home_image_path: trimOrNull(input.featured_home_image_path),
      featured_home_alt_en: trimOrNull(input.featured_home_alt_en),
      featured_home_alt_ka: trimOrNull(input.featured_home_alt_ka),

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