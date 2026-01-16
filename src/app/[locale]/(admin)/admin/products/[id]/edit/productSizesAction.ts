"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { fdString } from "@/lib/forms/formData";

export type ProductSizesState = {
  ok: boolean;
  message?: string;
};

function uniqStrings(vs: unknown[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of vs) {
    const s = typeof v === "string" ? v.trim() : "";
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function revalidateProductPages(locale: string, productId: string) {
  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/admin/products/${productId}/edit`);
}

type VariantRow = {
  id: string;
  product_id: string;
  color_id: string;
  size_id: string;
  is_active: boolean;
  color: string | null;
  size: string | null;
};

export async function productSizesAction(
  locale: string,
  productId: string,
  _prev: ProductSizesState,
  formData: FormData
): Promise<ProductSizesState> {
  await requireAdmin(locale);
  const db = createAdminClient();

  const intent = fdString(formData, "_intent");
  if (intent !== "sizes_save") return { ok: false, message: "Unknown action." };

  const desiredSizeIds = uniqStrings(formData.getAll("size_ids"));
  if (desiredSizeIds.length === 0) {
    return { ok: false, message: "Select at least 1 size." };
  }

  const { data: variantsRaw, error: vErr } = await db
    .from("product_variants")
    .select("id,product_id,color_id,size_id,is_active,color,size")
    .eq("product_id", productId)
    .overrideTypes<VariantRow[], { merge: false }>();

  if (vErr) return { ok: false, message: vErr.message };

  const variants = variantsRaw ?? [];
  const activeVariants = variants.filter((v) => v.is_active);

  const colorIds = Array.from(new Set(activeVariants.map((v) => v.color_id)));
  if (colorIds.length === 0) {
    return { ok: false, message: "This product has no active colors to build variants." };
  }

  // Validate sizes exist, also get their code
  const { data: sizeRows, error: sErr } = await db
    .from("sizes")
    .select("id,code")
    .in("id", desiredSizeIds);

  if (sErr) return { ok: false, message: sErr.message };

  const sizeById = new Map<string, string>();
  for (const r of (sizeRows ?? []) as Array<{ id: string; code: string }>) {
    sizeById.set(r.id, r.code);
  }

  if (sizeById.size !== desiredSizeIds.length) {
    return { ok: false, message: "One or more selected sizes are invalid." };
  }

  // Get color codes for inserts
  const { data: colorRows, error: cErr } = await db
    .from("colors")
    .select("id,code")
    .in("id", colorIds);

  if (cErr) return { ok: false, message: cErr.message };

  const colorById = new Map<string, string>();
  for (const r of (colorRows ?? []) as Array<{ id: string; code: string }>) {
    colorById.set(r.id, r.code);
  }
  if (colorById.size !== colorIds.length) {
    return { ok: false, message: "One or more product colors are invalid." };
  }

  // Existing combos lookup (includes inactive, so we can reactivate)
  const byCombo = new Map<string, VariantRow>();
  for (const v of variants) {
    byCombo.set(`${v.color_id}::${v.size_id}`, v);
  }

  const desiredSet = new Set(desiredSizeIds);

  // Deactivate removed sizes (only active rows)
  const currentActiveSizeIds = Array.from(
    new Set(activeVariants.map((v) => v.size_id))
  );
  const toDeactivateSizes = currentActiveSizeIds.filter((id) => !desiredSet.has(id));

  if (toDeactivateSizes.length > 0) {
    const { error: dErr } = await db
      .from("product_variants")
      .update({ is_active: false })
      .eq("product_id", productId)
      .in("size_id", toDeactivateSizes)
      .eq("is_active", true);

    if (dErr) return { ok: false, message: dErr.message };
  }

  // Ensure all combos exist and are active for active colors × desired sizes
  const toReactivateIds: string[] = [];
  const toInsert: Array<{
    product_id: string;
    color_id: string;
    size_id: string;
    color: string;
    size: string;
    is_active: boolean;
  }> = [];

  for (const colorId of colorIds) {
    const colorCode = colorById.get(colorId)!;

    for (const sizeId of desiredSizeIds) {
      const sizeCode = sizeById.get(sizeId)!;
      const key = `${colorId}::${sizeId}`;
      const existing = byCombo.get(key);

      if (existing) {
        if (!existing.is_active) toReactivateIds.push(existing.id);
        continue;
      }

      toInsert.push({
        product_id: productId,
        color_id: colorId,
        size_id: sizeId,
        color: colorCode,
        size: sizeCode,
        is_active: true,
      });
    }
  }

  if (toReactivateIds.length > 0) {
    const { error: rErr } = await db
      .from("product_variants")
      .update({ is_active: true })
      .in("id", toReactivateIds);

    if (rErr) return { ok: false, message: rErr.message };
  }

  if (toInsert.length > 0) {
    const { error: iErr } = await db.from("product_variants").insert(toInsert);
    if (iErr) return { ok: false, message: iErr.message };
  }

  revalidateProductPages(locale, productId);

  const msgParts: string[] = [];
  if (toDeactivateSizes.length > 0) msgParts.push(`Removed ${toDeactivateSizes.length} size(s)`);
  if (toInsert.length > 0) msgParts.push(`Added ${toInsert.length} variant(s)`);
  if (toReactivateIds.length > 0) msgParts.push(`Reactivated ${toReactivateIds.length} variant(s)`);
  const message = msgParts.length ? `${msgParts.join(". ")}.` : "Sizes saved.";

  return { ok: true, message };
}
