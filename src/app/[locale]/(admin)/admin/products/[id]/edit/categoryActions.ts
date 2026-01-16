"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { fdString } from "@/lib/helpers";
export type ProductCategoriesState = {
  ok: boolean;
  message?: string;
};

const IntentSchema = z.enum(["add", "remove", "reorder"]);
const Uuid = z.uuid();

export async function productCategoriesAction(
  locale: string,
  productId: string,
  _prev: ProductCategoriesState,
  formData: FormData
): Promise<ProductCategoriesState> {
  await requireAdmin(locale);
  const db = createAdminClient();

  const intentRaw = fdString(formData, "_intent");
  const intentParsed = IntentSchema.safeParse(intentRaw);
  if (!intentParsed.success) return { ok: false, message: "Invalid action." };
  const intent = intentParsed.data;

  if (intent === "add") {
    const categoryId = fdString(formData, "category_id");
    const okId = Uuid.safeParse(categoryId);
    if (!okId.success) return { ok: false, message: "Invalid category." };

    const { data: existing, error: exErr } = await db
      .from("product_categories")
      .select("category_id")
      .eq("product_id", productId)
      .eq("category_id", categoryId)
      .maybeSingle();

    if (exErr) return { ok: false, message: exErr.message };
    if (existing) return { ok: false, message: "Category already added." };

    const { data: last, error: lastErr } = await db
      .from("product_categories")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) return { ok: false, message: lastErr.message };

    const nextPos =
      (typeof last?.position === "number" ? last.position : 0) + 1;

    const { error } = await db
      .from("product_categories")
      .insert({
        product_id: productId,
        category_id: categoryId,
        position: nextPos,
      });

    if (error) return { ok: false, message: error.message };

    revalidatePath(`/${locale}/admin/products/${productId}/edit`);
    revalidatePath(`/${locale}/admin/products/${productId}`);
    revalidatePath(`/${locale}/admin/products`);

    return { ok: true, message: "Category added." };
  }

  if (intent === "remove") {
    const categoryId = fdString(formData, "category_id");
    const okId = Uuid.safeParse(categoryId);
    if (!okId.success) return { ok: false, message: "Invalid category." };

    const { error: delErr } = await db
      .from("product_categories")
      .delete()
      .eq("product_id", productId)
      .eq("category_id", categoryId);

    if (delErr) return { ok: false, message: delErr.message };

    const { data: remaining, error: remErr } = await db
      .from("product_categories")
      .select("category_id,position")
      .eq("product_id", productId)
      .order("position", { ascending: true });

    if (remErr) return { ok: false, message: remErr.message };

    const ids = (remaining ?? [])
      .map((r) => r.category_id)
      .filter((x): x is string => !!x);
    const updates = ids.map((cid, idx) => ({
      product_id: productId,
      category_id: cid,
      position: idx + 1,
    }));

    if (updates.length > 0) {
      const { error: upErr } = await db
        .from("product_categories")
        .upsert(updates, { onConflict: "product_id,category_id" });

      if (upErr) return { ok: false, message: upErr.message };
    }

    revalidatePath(`/${locale}/admin/products/${productId}/edit`);
    revalidatePath(`/${locale}/admin/products/${productId}`);
    revalidatePath(`/${locale}/admin/products`);

    return { ok: true, message: "Category removed." };
  }

  const orderJson = fdString(formData, "order_json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(orderJson);
  } catch {
    return { ok: false, message: "Invalid order payload." };
  }

  const arr = z.array(z.uuid()).safeParse(parsed);
  if (!arr.success) return { ok: false, message: "Invalid order payload." };

  const orderIds = arr.data;
  const updates = orderIds.map((cid, idx) => ({
    product_id: productId,
    category_id: cid,
    position: idx + 1,
  }));

  const { error: upErr } = await db
    .from("product_categories")
    .upsert(updates, { onConflict: "product_id,category_id" });

  if (upErr) return { ok: false, message: upErr.message };

  revalidatePath(`/${locale}/admin/products/${productId}/edit`);
  revalidatePath(`/${locale}/admin/products/${productId}`);
  revalidatePath(`/${locale}/admin/products`);

  return { ok: true, message: "Order saved." };
}
