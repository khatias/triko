"use server";

import { requireAdmin } from "@/utils/auth/requireAdmin";
import { previewBundleSizes } from "./_queries/preview";

function makeBundleCode(top: string, bottom: string) {
  return `BNDL:${top}+${bottom}`;
}

export async function previewSizesAction(locale: string, top: string, bottom: string) {
  if (!top || !bottom) return [];
  if (top === bottom) return [];
  return previewBundleSizes(locale, top, bottom);
}

export async function createBundleAction(
  locale: string,
  payload: {
    top_parent_code: string;
    bottom_parent_code: string;
    name_ka: string;
    name_en: string;
  },
) {
  const { supabase } = await requireAdmin(locale);

  const top = payload.top_parent_code.trim();
  const bottom = payload.bottom_parent_code.trim();

  if (!top || !bottom) throw new Error("Top and bottom are required.");
  if (top === bottom) throw new Error("Top and bottom cannot be the same.");

  const sizes = await previewBundleSizes(locale, top, bottom);
  if (sizes.length === 0) {
    throw new Error("No matching sizes between top and bottom.");
  }

  const bundle_code = makeBundleCode(top, bottom);

  // Insert bundle
  const { data: bundle, error: bErr } = await supabase
    .from("shop_bundles")
    .insert({
      bundle_code,
      name_ka: payload.name_ka,
      name_en: payload.name_en,
      is_active: true,
    })
    .select("id,bundle_code")
    .single();

  if (bErr) throw new Error(bErr.message);

  // Insert items (top + bottom)
  const { error: iErr } = await supabase.from("shop_bundle_items").insert([
    { bundle_id: bundle.id, part_role: "top", part_parent_code: top, qty: 1, sort_order: 1 },
    { bundle_id: bundle.id, part_role: "bottom", part_parent_code: bottom, qty: 1, sort_order: 2 },
  ]);

  if (iErr) throw new Error(iErr.message);

  return { ok: true as const, bundle_code: bundle.bundle_code };
}