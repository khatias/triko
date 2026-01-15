// src/app/[locale]/(admin)/admin/products/new/actions/createProduct.ts
"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";

import { fdString, fdOptionalString, fdIdsUnique } from "@/lib/forms/formData";
import {
  CreateProductFormSchema,
  toInsertProduct,
  type CreateProductFormInput,
} from "@/lib/validation/product";

import {
  uploadImage,
  removeUploadedPaths,
  readFile,
  readFiles,
  makeImagePath,
} from "@/lib/admin/uploads/productImages";

type DebugInfo = {
  step: string;
  code?: string;
  details?: string;
  hint?: string;
  extra?: Record<string, string>;
};

export type FieldIssue = { path: string; message: string };

export type CreateProductState = {
  ok: boolean;
  id?: string;
  message: string;
  issues?: FieldIssue[];
  debug?: DebugInfo;
};

// Use untyped client here to avoid "never" issues if Database types are incomplete
type Db = SupabaseClient;

const ACTION_DEBUG = process.env.ACTION_DEBUG === "1";

const MAX_VARIANTS = 5000;
const VARIANT_INSERT_CHUNK = 500;

// Image limits (optional safety)
const MAX_GALLERY_IMAGES = 20;
const MAX_COLOR_IMAGES_PER_COLOR = 20;

// If you added column primary_image_bucket, store it. If not, fallback automatically.
const PRODUCT_IMAGES_BUCKET = "product-images";

function withDebug(state: CreateProductState, debug?: DebugInfo): CreateProductState {
  if (!ACTION_DEBUG) return state;
  return { ...state, debug };
}

// Convert Zod issues to FieldIssue format
function zodIssuesToFieldIssues(issues: ZodError["issues"]): FieldIssue[] {
  return issues.map((i) => {
    const parts = i.path;
    const first =
      parts.length > 0
        ? typeof parts[0] === "symbol"
          ? parts[0].description ?? "symbol"
          : String(parts[0])
        : "";

    if (first === "category_ids" || first === "color_ids" || first === "size_ids") {
      return { path: first, message: i.message };
    }

    const path = parts
      .map((p) => (typeof p === "symbol" ? p.description ?? "symbol" : String(p)))
      .join(".");

    return { path, message: i.message };
  });
}

// Map certain DB errors to field issues
function maybeFieldIssueFromDbError(err: PostgrestError | null): FieldIssue[] | undefined {
  if (!err) return undefined;

  // unique_violation
  if (err.code === "23505") {
    const blob = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
    if (blob.includes("slug")) {
      return [{ path: "slug", message: "Slug already exists" }];
    }
  }

  return undefined;
}

// Rollback created product and its relations
async function rollbackCreatedProduct(db: Db, productId: string): Promise<void> {
  try {
    await db.from("product_variants").delete().eq("product_id", productId);
  } catch {}

  try {
    await db.from("product_categories").delete().eq("product_id", productId);
  } catch {}

  // product_images and product_color_images should be ON DELETE CASCADE from products
  try {
    await db.from("products").delete().eq("id", productId);
  } catch {}
}

// Build a fast lookup map: id -> code (used for colors/sizes)
function buildIdCodeMap(rows: Array<{ id: string; code: string }> | null): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of rows ?? []) m.set(r.id, r.code);
  return m;
}

// Insert many rows safely by splitting into smaller batches (avoids payload/timeout limits)
async function insertInChunks<T extends Record<string, unknown>>(
  db: Db,
  table: string,
  rows: T[],
  chunkSize: number
): Promise<{ error: PostgrestError | null }> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await db.from(table).insert(chunk as never);
    if (error) return { error };
  }
  return { error: null };
}

async function updatePrimaryImageFields(
  db: Db,
  productId: string,
  url: string,
  path: string
): Promise<PostgrestError | null> {
  // Try with bucket column
  const attempt1 = await db
    .from("products")
    .update({
      primary_image_url: url,
      primary_image_path: path,
      primary_image_bucket: PRODUCT_IMAGES_BUCKET,
    } as never)
    .eq("id", productId);

  if (!attempt1.error) return null;

  // If column does not exist, fallback
  if (attempt1.error.code === "42703") {
    const attempt2 = await db
      .from("products")
      .update({ primary_image_url: url, primary_image_path: path } as never)
      .eq("id", productId);

    return attempt2.error ?? null;
  }

  return attempt1.error;
}

export async function createProductAction(
  locale: string,
  _prev: CreateProductState,
  fd: FormData
): Promise<CreateProductState> {
  const debugBase: DebugInfo = { step: "start" };

  try {
    // Gate access with user session
    await requireAdmin(locale);

    // Service role client for all writes (bypasses RLS)
    const db = createAdminClient() as unknown as Db;

    const raw: CreateProductFormInput = {
      status: (fdString(fd, "status").trim() || "draft") as CreateProductFormInput["status"],
      name_en: fdString(fd, "name_en"),
      name_ka: fdString(fd, "name_ka"),
      slug: fdString(fd, "slug"),
      price_cents: fdString(fd, "price_cents"),
      description_en: fdOptionalString(fd, "description_en"),
      description_ka: fdOptionalString(fd, "description_ka"),
      category_ids: fdIdsUnique(fd, "category_ids"),
      color_ids: fdIdsUnique(fd, "color_ids"),
      size_ids: fdIdsUnique(fd, "size_ids"),
    };

    const parsed = CreateProductFormSchema.safeParse(raw);
    if (!parsed.success) {
      return withDebug(
        {
          ok: false,
          message: "Validation failed",
          issues: zodIssuesToFieldIssues(parsed.error.issues),
        },
        { ...debugBase, step: "validate" }
      );
    }

    const input = parsed.data;

    // Safety guards even if schema changes later
    if (input.color_ids.length === 0) {
      return {
        ok: false,
        message: "Pick at least 1 color",
        issues: [{ path: "color_ids", message: "Select at least one color" }],
      };
    }
    if (input.size_ids.length === 0) {
      return {
        ok: false,
        message: "Pick at least 1 size",
        issues: [{ path: "size_ids", message: "Select at least one size" }],
      };
    }

    const variantCount = input.color_ids.length * input.size_ids.length;
    if (variantCount > MAX_VARIANTS) {
      return {
        ok: false,
        message: "Too many variants selected",
        issues: [
          {
            path: "color_ids",
            message: `Too many combinations (${variantCount}). Reduce colors or sizes.`,
          },
          {
            path: "size_ids",
            message: `Too many combinations (${variantCount}). Reduce colors or sizes.`,
          },
        ],
      };
    }

    // 1) create product
    const insertProduct = toInsertProduct(input);

    const { data: created, error: productError } = await db
      .from("products")
      .insert(insertProduct as never)
      .select("id")
      .single();

    const productId = (created as { id?: string } | null)?.id ?? null;

    if (productError || !productId) {
      return withDebug(
        {
          ok: false,
          message: productError?.message ?? "Failed to create product",
          issues: maybeFieldIssueFromDbError(productError),
        },
        {
          ...debugBase,
          step: "insert_product",
          code: productError?.code ?? undefined,
          details: productError?.details ?? undefined,
          hint: productError?.hint ?? undefined,
        }
      );
    }

    // 2) link categories (skip empty)
    if (input.category_ids.length > 0) {
      const rows = input.category_ids.map((category_id, idx) => ({
        product_id: productId,
        category_id,
        position: idx,
      }));

      const { error: catLinkErr } = await db.from("product_categories").insert(rows as never);

      if (catLinkErr) {
        await rollbackCreatedProduct(db, productId);
        return withDebug(
          { ok: false, message: catLinkErr.message },
          {
            ...debugBase,
            step: "link_categories",
            code: catLinkErr.code ?? undefined,
            details: catLinkErr.details ?? undefined,
            hint: catLinkErr.hint ?? undefined,
          }
        );
      }
    }

    // 3) load selected colors + sizes (id -> code)
    const { data: colorRowsRaw, error: cErr } = await db
      .from("colors")
      .select("id,code")
      .in("id", input.color_ids);

    if (cErr) {
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: cErr.message },
        {
          ...debugBase,
          step: "load_colors",
          code: cErr.code ?? undefined,
          details: cErr.details ?? undefined,
          hint: cErr.hint ?? undefined,
        }
      );
    }

    const { data: sizeRowsRaw, error: sErr } = await db
      .from("sizes")
      .select("id,code")
      .in("id", input.size_ids);

    if (sErr) {
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: sErr.message },
        {
          ...debugBase,
          step: "load_sizes",
          code: sErr.code ?? undefined,
          details: sErr.details ?? undefined,
          hint: sErr.hint ?? undefined,
        }
      );
    }

    const colorById = buildIdCodeMap((colorRowsRaw ?? null) as Array<{ id: string; code: string }> | null);
    const sizeById = buildIdCodeMap((sizeRowsRaw ?? null) as Array<{ id: string; code: string }> | null);

    // 4) create variants (no stock)
    const variants: Array<{
      product_id: string;
      color_id: string;
      size_id: string;
      color: string;
      size: string;
      is_active: boolean;
    }> = [];

    for (const color_id of input.color_ids) {
      const color = colorById.get(color_id);
      if (!color) {
        await rollbackCreatedProduct(db, productId);
        return withDebug(
          {
            ok: false,
            message: "Selected color not found",
            issues: [{ path: "color_ids", message: "One of the selected colors is invalid" }],
          },
          { ...debugBase, step: "map_color", extra: { color_id } }
        );
      }

      for (const size_id of input.size_ids) {
        const size = sizeById.get(size_id);
        if (!size) {
          await rollbackCreatedProduct(db, productId);
          return withDebug(
            {
              ok: false,
              message: "Selected size not found",
              issues: [{ path: "size_ids", message: "One of the selected sizes is invalid" }],
            },
            { ...debugBase, step: "map_size", extra: { size_id } }
          );
        }

        variants.push({
          product_id: productId,
          color_id,
          size_id,
          color,
          size,
          is_active: true,
        });
      }
    }

    const { error: vErr } = await insertInChunks(db, "product_variants", variants, VARIANT_INSERT_CHUNK);
    if (vErr) {
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: vErr.message },
        {
          ...debugBase,
          step: "insert_variants",
          code: vErr.code ?? undefined,
          details: vErr.details ?? undefined,
          hint: vErr.hint ?? undefined,
        }
      );
    }

    // 5) upload images (primary + gallery + optional per-color)
    const uploadedPaths: string[] = [];

    try {
      // Primary
      const primaryFile = readFile(fd, "primary_image");
      if (primaryFile) {
        const path = makeImagePath({ productId, kind: "primary", index: 0, file: primaryFile });
        const up = await uploadImage(db as never, path, primaryFile);
        if ("error" in up) {
          await rollbackCreatedProduct(db, productId);
          return withDebug({ ok: false, message: up.error }, { ...debugBase, step: "upload_primary" });
        }
        uploadedPaths.push(up.path);

        const upErr = await updatePrimaryImageFields(db, productId, up.url, up.path);
        if (upErr) {
          await removeUploadedPaths(db as never, uploadedPaths);
          await rollbackCreatedProduct(db, productId);
          return withDebug(
            { ok: false, message: upErr.message },
            { ...debugBase, step: "save_primary_url", code: upErr.code ?? undefined, details: upErr.details ?? undefined, hint: upErr.hint ?? undefined }
          );
        }
      }

      // Gallery
      const galleryFilesAll = readFiles(fd, "gallery_images");
      const galleryFiles = galleryFilesAll.slice(0, MAX_GALLERY_IMAGES);

      if (galleryFiles.length > 0) {
        const galleryRows: Array<{
          product_id: string;
          url: string;
          storage_path: string;
          position: number;
        }> = [];

        for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i]!;
          const path = makeImagePath({ productId, kind: "gallery", index: i, file });
          const up = await uploadImage(db as never, path, file);
          if ("error" in up) {
            await removeUploadedPaths(db as never, uploadedPaths);
            await rollbackCreatedProduct(db, productId);
            return withDebug({ ok: false, message: up.error }, { ...debugBase, step: "upload_gallery" });
          }
          uploadedPaths.push(up.path);
          galleryRows.push({ product_id: productId, url: up.url, storage_path: up.path, position: i });
        }

        const { error: gErr } = await db.from("product_images").insert(galleryRows as never);
        if (gErr) {
          await removeUploadedPaths(db as never, uploadedPaths);
          await rollbackCreatedProduct(db, productId);
          return withDebug(
            { ok: false, message: gErr.message },
            { ...debugBase, step: "save_gallery_rows", code: gErr.code ?? undefined, details: gErr.details ?? undefined, hint: gErr.hint ?? undefined }
          );
        }
      }

      // Color specific images
      for (const colorId of input.color_ids) {
        const key = `color_images_${colorId}`;
        const colorFilesAll = readFiles(fd, key);
        const colorFiles = colorFilesAll.slice(0, MAX_COLOR_IMAGES_PER_COLOR);

        if (colorFiles.length === 0) continue;

        const colorRows: Array<{
          product_id: string;
          color_id: string;
          url: string;
          storage_path: string;
          position: number;
        }> = [];

        for (let i = 0; i < colorFiles.length; i++) {
          const file = colorFiles[i]!;
          const path = makeImagePath({ productId, kind: "color", colorId, index: i, file });
          const up = await uploadImage(db as never, path, file);
          if ("error" in up) {
            await removeUploadedPaths(db as never, uploadedPaths);
            await rollbackCreatedProduct(db, productId);
            return withDebug(
              { ok: false, message: up.error },
              { ...debugBase, step: "upload_color_images", extra: { colorId } }
            );
          }
          uploadedPaths.push(up.path);
          colorRows.push({
            product_id: productId,
            color_id: colorId,
            url: up.url,
            storage_path: up.path,
            position: i,
          });
        }

        const { error: cImgErr } = await db.from("product_color_images").insert(colorRows as never);
        if (cImgErr) {
          await removeUploadedPaths(db as never, uploadedPaths);
          await rollbackCreatedProduct(db, productId);
          return withDebug(
            { ok: false, message: cImgErr.message },
            { ...debugBase, step: "save_color_rows", extra: { colorId }, code: cImgErr.code ?? undefined, details: cImgErr.details ?? undefined, hint: cImgErr.hint ?? undefined }
          );
        }
      }
    } catch (e) {
      await removeUploadedPaths(db as never, uploadedPaths);
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: "Image upload failed" },
        { ...debugBase, step: "upload_catch", details: e instanceof Error ? e.message : "Unknown error" }
      );
    }

    // Revalidate only after everything succeeded
    revalidatePath(`/${locale}/admin/products`);

    return { ok: true, id: productId, message: "Created" };
  } catch (e: unknown) {
    return withDebug(
      { ok: false, message: "Server action crashed" },
      { step: "catch", details: e instanceof Error ? e.message : "Unknown error" }
    );
  }
}
