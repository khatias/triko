// src/app/[locale]/(admin)/admin/products/new/actions/createProduct.ts
"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { fdString, fdOptionalString, fdIdsUnique } from "@/lib/forms/formData";
import {
  CreateProductFormSchema,
  toInsertProduct,
  type CreateProductFormInput,
} from "@/lib/validation/product";
import type { Database } from "@/types/supabase";

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

type Db = SupabaseClient<Database>;

const ACTION_DEBUG = process.env.ACTION_DEBUG === "1";
const MAX_VARIANTS = 5000;
const VARIANT_INSERT_CHUNK = 500;

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

  if (err.code === "23505") {
    const blob = `${err.message ?? ""} ${err.details ?? ""}`.toLowerCase();
    if (blob.includes("slug")) {
      return [{ path: "slug", message: "Slug already exists" }];
    }
  }

  return undefined;
}
// Rollback created product and its relations
async function rollbackCreatedProduct(supabase: Db, productId: string): Promise<void> {
  try {
    await supabase.from("product_variants").delete().eq("product_id", productId);
  } catch {}

  try {
    await supabase.from("product_categories").delete().eq("product_id", productId);
  } catch {}

  try {
    await supabase.from("products").delete().eq("id", productId);
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
  supabase: Db,
  table: Parameters<Db["from"]>[0],
  rows: T[],
  chunkSize: number
): Promise<{ error: PostgrestError | null }> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(chunk as never);
    if (error) return { error };
  }
  return { error: null };
}

export async function createProductAction(
  locale: string,
  _prev: CreateProductState,
  fd: FormData
): Promise<CreateProductState> {
  const debugBase: DebugInfo = { step: "start" };

  try {
    const { supabase } = await requireAdmin(locale);
    const db = supabase as unknown as Db;

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
        { ok: false, message: "Validation failed", issues: zodIssuesToFieldIssues(parsed.error.issues) },
        { ...debugBase, step: "validate" }
      );
    }

    const input = parsed.data;

    // Safety guards even if schema changes later
    if (input.color_ids.length === 0) {
      return { ok: false, message: "Pick at least 1 color", issues: [{ path: "color_ids", message: "Select at least one color" }] };
    }
    if (input.size_ids.length === 0) {
      return { ok: false, message: "Pick at least 1 size", issues: [{ path: "size_ids", message: "Select at least one size" }] };
    }

    const variantCount = input.color_ids.length * input.size_ids.length;
    if (variantCount > MAX_VARIANTS) {
      return {
        ok: false,
        message: "Too many variants selected",
        issues: [
          { path: "color_ids", message: `Too many combinations (${variantCount}). Reduce colors or sizes.` },
          { path: "size_ids", message: `Too many combinations (${variantCount}). Reduce colors or sizes.` },
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

    if (productError || !created?.id) {
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

    const productId = created.id;

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
    const { data: colorRows, error: cErr } = await db
      .from("colors")
      .select("id,code")
      .in("id", input.color_ids);

    if (cErr) {
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: cErr.message },
        { ...debugBase, step: "load_colors", code: cErr.code ?? undefined, details: cErr.details ?? undefined, hint: cErr.hint ?? undefined }
      );
    }

    const { data: sizeRows, error: sErr } = await db
      .from("sizes")
      .select("id,code")
      .in("id", input.size_ids);

    if (sErr) {
      await rollbackCreatedProduct(db, productId);
      return withDebug(
        { ok: false, message: sErr.message },
        { ...debugBase, step: "load_sizes", code: sErr.code ?? undefined, details: sErr.details ?? undefined, hint: sErr.hint ?? undefined }
      );
    }

    const colorById = buildIdCodeMap((colorRows ?? null) as Array<{ id: string; code: string }> | null);
    const sizeById = buildIdCodeMap((sizeRows ?? null) as Array<{ id: string; code: string }> | null);

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
        { ...debugBase, step: "insert_variants", code: vErr.code ?? undefined, details: vErr.details ?? undefined, hint: vErr.hint ?? undefined }
      );
    }

    revalidatePath(`/${locale}/admin/products`);
    return { ok: true, id: productId, message: "Created" };
  } catch (e: unknown) {
    return withDebug(
      { ok: false, message: "Server action crashed" },
      { step: "catch", details: e instanceof Error ? e.message : "Unknown error" }
    );
  }
}
