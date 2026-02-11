// src/app/[locale]/admin/products/[parentCode]/_actions/product.ts
"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { SaveContentInputSchema } from "../_types/productDetail";

type ActionOk<T> = { ok: true; data: T };
type ActionErr = { ok: false; error: string };
type ActionResult<T> = ActionOk<T> | ActionErr;

const ParentCodeSchema = z.string().trim().min(1);

function ok<T>(data: T): ActionOk<T> {
  return { ok: true, data };
}
function err(message: string): ActionErr {
  return { ok: false, error: message };
}
function safeMessage(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message || fallback;
  return fallback;
}
function safeParentFolder(parentCode: string) {
  return parentCode.replace(/[^A-Za-z0-9_-]/g, "_");
}

/** ---------- content ---------- */

export async function ensureProductContentAction(
  locale: string,
  parentCode: string,
): Promise<ActionResult<null>> {
  try {
    const { supabase } = await requireAdmin(locale);
    const p_parent_code = ParentCodeSchema.parse(parentCode);

    const { error } = await supabase.rpc("admin_product_content_ensure", {
      p_parent_code,
    });
    if (error) return err(error.message);

    revalidatePath(`/${locale}/admin/products`);
    revalidatePath(`/${locale}/admin/products/${encodeURIComponent(parentCode)}`);

    return ok(null);
  } catch (e) {
    console.error("[ensureProductContentAction]", e);
    return err(safeMessage(e, "Failed to ensure content row."));
  }
}

export async function saveProductContentAction(
  locale: string,
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { supabase } = await requireAdmin(locale);

    const parsed = SaveContentInputSchema.safeParse(input);
    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid input.");
    }

    const data = parsed.data;

    // ensure row exists
    const { error: ensureErr } = await supabase.rpc(
      "admin_product_content_ensure",
      {
        p_parent_code: data.parentCode,
      },
    );
    if (ensureErr) return err(ensureErr.message);

    const { error } = await supabase
      .from("shop_product_content")
      .update({
        title_ka: data.title_ka ?? null,
        title_en: data.title_en ?? null,
        description_ka: data.description_ka ?? null,
        description_en: data.description_en ?? null,
        photos: data.photos, // normalized objects
        updated_at: new Date().toISOString(),
      })
      .eq("parent_code", data.parentCode);

    if (error) return err(error.message);

    revalidatePath(`/${locale}/admin/products`);
    revalidatePath(
      `/${locale}/admin/products/${encodeURIComponent(data.parentCode)}`,
    );

    return ok(null);
  } catch (e) {
    console.error("[saveProductContentAction]", e);
    return err(safeMessage(e, "Failed to save content."));
  }
}

export async function setProductPublishedAction(
  locale: string,
  parentCode: string,
  isPublished: boolean,
): Promise<ActionResult<null>> {
  try {
    const { supabase } = await requireAdmin(locale);
    const p_parent_code = ParentCodeSchema.parse(parentCode);
    const p_is_published = z.boolean().parse(isPublished);

    const { error } = await supabase.rpc("admin_product_set_published", {
      p_parent_code,
      p_is_published,
    });
    if (error) return err(error.message);

    revalidatePath(`/${locale}/admin/products`);
    revalidatePath(`/${locale}/admin/products/${encodeURIComponent(parentCode)}`);

    return ok(null);
  } catch (e) {
    console.error("[setProductPublishedAction]", e);
    return err(safeMessage(e, "Failed to update publish status."));
  }
}

/** ---------- upload ---------- */

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const ExtByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function uploadProductPhotoAction(
  locale: string,
  parentCode: string,
  formData: FormData,
): Promise<ActionResult<string>> {
  try {
    const { supabase } = await requireAdmin(locale);
    const p_parent_code = ParentCodeSchema.parse(parentCode);

    const file = formData.get("file");
    if (!(file instanceof File)) return err("No file provided.");

    if (!ALLOWED_MIME.has(file.type)) {
      return err("Unsupported image type. Use JPG, PNG, WEBP, or AVIF.");
    }
    if (file.size <= 0) return err("Empty file.");
    if (file.size > MAX_BYTES) return err("Image is too large (max 8MB).");

    const safeParent = safeParentFolder(p_parent_code);
    const ext = ExtByMime[file.type] ?? "jpg";
    const objectPath = `products/${safeParent}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(objectPath, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });

    if (upErr) return err(upErr.message);

    const { data } = supabase.storage.from("product-images").getPublicUrl(objectPath);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) return err("Upload succeeded but URL could not be created.");

    return ok(publicUrl);
  } catch (e) {
    console.error("[uploadProductPhotoAction]", e);
    return err(safeMessage(e, "Failed to upload image."));
  }
}
