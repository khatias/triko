"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  uploadImage,
  readFile,
  makeImagePath,
  removeUploadedPaths,
  readFiles,
} from "@/lib/admin/uploads/productImages";
import { fdString, fdJsonArray } from "@/lib/forms/formData";

export type ProductImagesState = {
  ok: boolean;
  message?: string;
};

function hasDuplicates(list: string[]): boolean {
  return new Set(list).size !== list.length;
}

function revalidateProductPages(locale: string, productId: string) {
  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/admin/products/${productId}/edit`);
}

export async function productImagesAction(
  locale: string,
  productId: string,
  _prev: ProductImagesState,
  formData: FormData
): Promise<ProductImagesState> {
  await requireAdmin(locale);
  const db = createAdminClient();

  const intent = fdString(formData, "_intent");

  if (intent === "primary_upload") {
    const file = readFile(formData, "primary_image");
    if (!file) return { ok: false, message: "Choose a file." };

    const { data: prod, error: pErr } = await db
      .from("products")
      .select("primary_image_path")
      .eq("id", productId)
      .maybeSingle();

    if (pErr) return { ok: false, message: pErr.message };

    const oldPath =
      (prod as { primary_image_path: string | null } | null)
        ?.primary_image_path ?? null;

    const newPath = makeImagePath({
      productId,
      kind: "primary",
      index: 0,
      file,
    });

    const up = await uploadImage(db, newPath, file);
    if ("error" in up) return { ok: false, message: up.error };

    const { error } = await db
      .from("products")
      .update({
        primary_image_path: up.path,
        primary_image_url: up.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      await removeUploadedPaths(db, [up.path]);
      return { ok: false, message: error.message };
    }

    if (oldPath) await removeUploadedPaths(db, [oldPath]);

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Primary image updated." };
  }

  if (intent === "primary_delete") {
    const { data: prod, error: pErr } = await db
      .from("products")
      .select("primary_image_path")
      .eq("id", productId)
      .maybeSingle();

    if (pErr) return { ok: false, message: pErr.message };

    const path =
      (prod as { primary_image_path: string | null } | null)
        ?.primary_image_path ?? null;

    const { error } = await db
      .from("products")
      .update({
        primary_image_path: null,
        primary_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) return { ok: false, message: error.message };

    if (path) await removeUploadedPaths(db, [path]);

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Primary image removed." };
  }

  if (intent === "gallery_upload") {
    const files = readFiles(formData, "gallery_images");
    if (files.length === 0)
      return { ok: false, message: "Choose at least one file." };

    const { data: maxPosRow, error: maxErr } = await db
      .from("product_images")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) return { ok: false, message: maxErr.message };

    const startPos =
      ((maxPosRow as { position: number | null } | null)?.position ?? -1) + 1;

    const uploadedPaths: string[] = [];
    const rowsToInsert: Array<{
      product_id: string;
      storage_path: string;
      url: string;
      position: number;
    }> = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const position = startPos + i;

      const path = makeImagePath({
        productId,
        kind: "gallery",
        index: position,
        file,
      });

      const up = await uploadImage(db, path, file);
      if ("error" in up) {
        await removeUploadedPaths(db, uploadedPaths);
        return { ok: false, message: up.error };
      }

      uploadedPaths.push(up.path);
      rowsToInsert.push({
        product_id: productId,
        storage_path: up.path,
        url: up.url,
        position,
      });
    }

    const { error } = await db.from("product_images").insert(rowsToInsert);
    if (error) {
      await removeUploadedPaths(db, uploadedPaths);
      return { ok: false, message: error.message };
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Gallery images added." };
  }

  if (intent === "gallery_delete") {
    const storagePath = fdString(formData, "storage_path");
    if (!storagePath) return { ok: false, message: "Missing storage_path." };

    const { data: row, error: rErr } = await db
      .from("product_images")
      .select("storage_path")
      .eq("product_id", productId)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (rErr) return { ok: false, message: rErr.message };
    if (!row) return { ok: false, message: "Image not found." };

    const { error } = await db
      .from("product_images")
      .delete()
      .eq("product_id", productId)
      .eq("storage_path", storagePath);

    if (error) return { ok: false, message: error.message };

    await removeUploadedPaths(db, [storagePath]);

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Gallery image removed." };
  }

  // ✅ BEST OPTION: reorder = UPDATE ONLY (no upsert)
  if (intent === "gallery_reorder") {
    const order = fdJsonArray(formData, "order_json");
    if (!order || order.length === 0)
      return { ok: false, message: "Nothing to reorder." };
    if (hasDuplicates(order))
      return { ok: false, message: "Invalid order (duplicates found)." };

    const { data: existing, error: eErr } = await db
      .from("product_images")
      .select("storage_path")
      .eq("product_id", productId);

    if (eErr) return { ok: false, message: eErr.message };

    const allowed = new Set((existing ?? []).map((r) => r.storage_path));
    for (const p of order) {
      if (!allowed.has(p))
        return { ok: false, message: "Invalid order (unknown image)." };
    }

    for (let i = 0; i < order.length; i += 1) {
      const storagePath = order[i];
      const { error } = await db
        .from("product_images")
        .update({ position: i })
        .eq("product_id", productId)
        .eq("storage_path", storagePath);

      if (error) return { ok: false, message: error.message };
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Gallery order saved." };
  }

  if (intent === "color_upload") {
    const colorId = fdString(formData, "color_id");
    if (!colorId) return { ok: false, message: "Missing color_id." };

    const files = readFiles(formData, "color_images");
    if (files.length === 0)
      return { ok: false, message: "Choose at least one file." };

    const { data: maxPosRow, error: maxErr } = await db
      .from("product_color_images")
      .select("position")
      .eq("product_id", productId)
      .eq("color_id", colorId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) return { ok: false, message: maxErr.message };

    const startPos =
      ((maxPosRow as { position: number | null } | null)?.position ?? -1) + 1;

    const uploadedPaths: string[] = [];
    const rowsToInsert: Array<{
      product_id: string;
      color_id: string;
      storage_path: string;
      url: string;
      position: number;
    }> = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const position = startPos + i;

      const path = makeImagePath({
        productId,
        kind: "color",
        colorId,
        index: position,
        file,
      });

      const up = await uploadImage(db, path, file);
      if ("error" in up) {
        await removeUploadedPaths(db, uploadedPaths);
        return { ok: false, message: up.error };
      }

      uploadedPaths.push(up.path);
      rowsToInsert.push({
        product_id: productId,
        color_id: colorId,
        storage_path: up.path,
        url: up.url,
        position,
      });
    }

    const { error } = await db
      .from("product_color_images")
      .insert(rowsToInsert);
    if (error) {
      await removeUploadedPaths(db, uploadedPaths);
      return { ok: false, message: error.message };
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Color images added." };
  }

  if (intent === "color_delete") {
    const colorId = fdString(formData, "color_id");
    const storagePath = fdString(formData, "storage_path");
    if (!colorId || !storagePath)
      return { ok: false, message: "Missing color_id or storage_path." };

    const { data: row, error: rErr } = await db
      .from("product_color_images")
      .select("storage_path")
      .eq("product_id", productId)
      .eq("color_id", colorId)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (rErr) return { ok: false, message: rErr.message };
    if (!row) return { ok: false, message: "Image not found." };

    const { error } = await db
      .from("product_color_images")
      .delete()
      .eq("product_id", productId)
      .eq("color_id", colorId)
      .eq("storage_path", storagePath);

    if (error) return { ok: false, message: error.message };

    await removeUploadedPaths(db, [storagePath]);

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Color image removed." };
  }

  // ✅ BEST OPTION: reorder = UPDATE ONLY (no upsert)
  if (intent === "color_reorder") {
    const colorId = fdString(formData, "color_id");
    if (!colorId) return { ok: false, message: "Missing color_id." };

    const order = fdJsonArray(formData, "order_json");
    if (!order || order.length === 0)
      return { ok: false, message: "Nothing to reorder." };
    if (hasDuplicates(order))
      return { ok: false, message: "Invalid order (duplicates found)." };

    const { data: existing, error: eErr } = await db
      .from("product_color_images")
      .select("storage_path")
      .eq("product_id", productId)
      .eq("color_id", colorId);

    if (eErr) return { ok: false, message: eErr.message };

    const allowed = new Set((existing ?? []).map((r) => r.storage_path));
    for (const p of order) {
      if (!allowed.has(p))
        return { ok: false, message: "Invalid order (unknown image)." };
    }

    for (let i = 0; i < order.length; i += 1) {
      const storagePath = order[i];
      const { error } = await db
        .from("product_color_images")
        .update({ position: i })
        .eq("product_id", productId)
        .eq("color_id", colorId)
        .eq("storage_path", storagePath);

      if (error) return { ok: false, message: error.message };
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Color order saved." };
  }

  return { ok: false, message: "Unknown action." };
}
