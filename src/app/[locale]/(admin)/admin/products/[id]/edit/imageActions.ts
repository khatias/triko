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

function uniq(list: string[]): string[] {
  return Array.from(new Set(list));
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

  // ------------------------------------------------------------
  // NEW: Add color to product (creates variants for all sizes)
  // ------------------------------------------------------------
  if (intent === "variant_add_color") {
    const colorId = fdString(formData, "color_id");
    if (!colorId) return { ok: false, message: "Missing color_id." };

    // Load color code (stored in product_variants.color)
    const { data: colorRow, error: cErr } = await db
      .from("colors")
      .select("id,code")
      .eq("id", colorId)
      .maybeSingle();

    if (cErr) return { ok: false, message: cErr.message };
    if (!colorRow) return { ok: false, message: "Color not found." };

    // Existing sizes on this product
    const { data: sizeRows, error: sErr } = await db
      .from("product_variants")
      .select("size_id")
      .eq("product_id", productId);

    if (sErr) return { ok: false, message: sErr.message };

    const allSizeIds = uniq((sizeRows ?? []).map((r) => String(r.size_id)));
    if (allSizeIds.length === 0) {
      return { ok: false, message: "No sizes found for this product." };
    }

    // Avoid duplicates if color already partially exists
    const { data: existingForColor, error: exErr } = await db
      .from("product_variants")
      .select("size_id")
      .eq("product_id", productId)
      .eq("color_id", colorId);

    if (exErr) return { ok: false, message: exErr.message };

    const existingSizeIds = new Set(
      (existingForColor ?? []).map((r) => String(r.size_id))
    );
    const missingSizeIds = allSizeIds.filter((id) => !existingSizeIds.has(id));

    if (missingSizeIds.length === 0) {
      revalidateProductPages(locale, productId);
      return { ok: true, message: "Color already exists." };
    }

    // Load size codes (stored in product_variants.size)
    const { data: sizeCodeRows, error: scErr } = await db
      .from("sizes")
      .select("id,code")
      .in("id", missingSizeIds);

    if (scErr) return { ok: false, message: scErr.message };

    const sizeCodeById = new Map<string, string>();
    for (const r of sizeCodeRows ?? []) {
      sizeCodeById.set(String(r.id), String(r.code));
    }

    const rowsToInsert: Array<{
      product_id: string;
      color_id: string;
      size_id: string;
      color: string;
      size: string;
      is_active: boolean;
    }> = missingSizeIds.map((size_id) => ({
      product_id: productId,
      color_id: colorId,
      size_id,
      color: String(colorRow.code),
      size: sizeCodeById.get(size_id) ?? "",
      is_active: true,
    }));

    // Insert in chunks to be safe
    for (let i = 0; i < rowsToInsert.length; i += 500) {
      const chunk = rowsToInsert.slice(i, i + 500);
      const { error } = await db.from("product_variants").insert(chunk);
      if (error) {
        // If unique constraint, someone double clicked, treat as ok
        if ((error as { code?: string }).code === "23505") break;
        return { ok: false, message: error.message };
      }
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Color added." };
  }

  // ------------------------------------------------------------
  // NEW: Remove color from product (deletes variants + color images)
  // ------------------------------------------------------------
  if (intent === "variant_remove_color") {
    const colorId = fdString(formData, "color_id");
    if (!colorId) return { ok: false, message: "Missing color_id." };

    // Prevent deleting last color
    const { data: allVarColors, error: vcErr } = await db
      .from("product_variants")
      .select("color_id")
      .eq("product_id", productId);

    if (vcErr) return { ok: false, message: vcErr.message };

    const colorSet = uniq((allVarColors ?? []).map((r) => String(r.color_id)));
    if (colorSet.length <= 1 && colorSet[0] === colorId) {
      return { ok: false, message: "Product must have at least 1 color." };
    }

    // Collect storage paths for this color images (for storage cleanup)
    const { data: imgRows, error: imgErr } = await db
      .from("product_color_images")
      .select("storage_path")
      .eq("product_id", productId)
      .eq("color_id", colorId);

    if (imgErr) return { ok: false, message: imgErr.message };

    const paths = (imgRows ?? [])
      .map((r) => String(r.storage_path))
      .filter(Boolean);

    // Delete DB rows first
    const { error: delImgsErr } = await db
      .from("product_color_images")
      .delete()
      .eq("product_id", productId)
      .eq("color_id", colorId);

    if (delImgsErr) return { ok: false, message: delImgsErr.message };

    const { error: delVarErr } = await db
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .eq("color_id", colorId);

    if (delVarErr) return { ok: false, message: delVarErr.message };

    // Best effort storage cleanup
    if (paths.length > 0) {
      await removeUploadedPaths(db, paths);
    }

    revalidateProductPages(locale, productId);
    return { ok: true, message: "Color removed." };
  }

  // ---------------- your existing intents below ----------------

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
