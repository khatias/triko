"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { createAdminClient } from "@/utils/supabase/admin";
import { removeUploadedPaths } from "@/lib/admin/uploads/productImages";
import { fdString } from "@/lib/forms/formData";

export type DeleteProductState = { ok: boolean; message?: string };

export async function deleteProductAction(
  locale: string,
  productId: string,
  _prev: DeleteProductState,
  fd: FormData
): Promise<DeleteProductState> {
  await requireAdmin(locale);
  const db = createAdminClient();

  const intent = fdString(fd, "_intent");
  if (intent !== "delete_product") {
    return {
      ok: false,
      message: `Missing/invalid _intent. Expected "delete_product", got "${intent || "(empty)"}"`,
    };
  }

  // collect paths BEFORE DB delete
  const [{ data: prod }, { data: gallery }, { data: colorImgs }] =
    await Promise.all([
      db.from("products").select("primary_image_path").eq("id", productId).maybeSingle(),
      db.from("product_images").select("storage_path").eq("product_id", productId),
      db.from("product_color_images").select("storage_path").eq("product_id", productId),
    ]);

  const primaryPath =
    (prod as { primary_image_path: string | null } | null)?.primary_image_path ?? null;

  const paths = Array.from(
    new Set(
      [
        ...(primaryPath ? [primaryPath] : []),
        ...(gallery ?? []).map((r) => r.storage_path),
        ...(colorImgs ?? []).map((r) => r.storage_path),
      ].filter(Boolean)
    )
  ) as string[];

  // delete product (cascades rows)
  const { error: dErr } = await db.from("products").delete().eq("id", productId);
  if (dErr) return { ok: false, message: dErr.message };

  // delete bucket files (best effort)
  if (paths.length) {
    try {
      await removeUploadedPaths(db, paths);
    } catch {
      revalidatePath(`/${locale}/admin/products`);
      return { ok: true, message: "Product deleted, but storage cleanup failed." };
    }
  }

  revalidatePath(`/${locale}/admin/products`);
  return { ok: true, message: "Product deleted." };
}
