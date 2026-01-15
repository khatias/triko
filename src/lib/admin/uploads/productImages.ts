// src/lib/uploads/productImages.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type Db = SupabaseClient<Database>;

const BUCKET = "product-images";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isFile(v: unknown): v is File {
  return typeof File !== "undefined" && v instanceof File;
}

function extFromFile(file: File): string {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "bin";
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Only JPG, PNG, WEBP allowed";
  if (file.size <= 0) return "Empty file";
  if (file.size > MAX_FILE_BYTES) return "File too large (max 10MB)";
  return null;
}

export async function uploadImage(
  db: Db,
  path: string,
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const err = validateImageFile(file);
  if (err) return { error: err };

  const bytes = await file.arrayBuffer();

  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
      cacheControl: "31536000",
    });

  if (upErr) return { error: upErr.message };

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeUploadedPaths(db: Db, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await db.storage.from(BUCKET).remove(paths);
  } catch {}
}

export function readFile(fd: FormData, key: string): File | null {
  const v = fd.get(key);
  if (!isFile(v)) return null;
  if (v.size <= 0) return null;
  return v;
}

export function readFiles(fd: FormData, key: string): File[] {
  return fd
    .getAll(key)
    .filter(isFile)
    .filter((f) => f.size > 0);
}

export function makeImagePath(opts: {
  productId: string;
  kind: "primary" | "gallery" | "color";
  colorId?: string;
  index: number;
  file: File;
}): string {
  const ext = extFromFile(opts.file);
  const rand = crypto.randomUUID();
  const base = `products/${opts.productId}`;

  if (opts.kind === "primary") return `${base}/primary-${rand}.${ext}`;
  if (opts.kind === "gallery") return `${base}/gallery-${opts.index}-${rand}.${ext}`;
  // color
  return `${base}/color-${opts.colorId}-${opts.index}-${rand}.${ext}`;
}
