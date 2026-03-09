// src/app/[locale]/(admin)/admin/site/_components/hero/heroActions.ts
"use server";

import "server-only";
import sharp from "sharp";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { isString } from "@/utils/type-guards";

function asFile(v: FormDataEntryValue | null): File | null {
  if (!v) return null;
  if (typeof v === "string") return null;
  return v;
}

function normalizePath(p: string): string {
  const s = p.trim();
  if (!s) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

// Hero processing config
const HERO_MAX_BYTES = 12 * 1024 * 1024; // input limit (you can change)
const HERO_ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const HERO_MAX_WIDTH_MAIN = 2400; // hero main can be bigger
const HERO_MAX_WIDTH_SIDE = 1400; // side image usually smaller
const HERO_WEBP_QUALITY = 82;

function uniqueHeroPath(kind: "main" | "side"): string {
  return `hero/${kind}-${Date.now()}-${crypto.randomUUID()}.webp`;
}

async function processHeroImage(
  file: File,
  kind: "main" | "side",
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!HERO_ALLOWED_MIME.has(file.type)) {
    throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or AVIF.");
  }
  if (file.size <= 0) throw new Error("Empty file.");
  if (file.size > HERO_MAX_BYTES) throw new Error("Image is too large.");

  const input = Buffer.from(await file.arrayBuffer());
  const maxWidth = kind === "main" ? HERO_MAX_WIDTH_MAIN : HERO_MAX_WIDTH_SIDE;

  const out = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: HERO_WEBP_QUALITY })
    .toBuffer();

  return { buffer: out, contentType: "image/webp" };
}

async function uploadHeroImageBytes(bytes: Buffer, path: string, contentType: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from("site").upload(path, bytes, {
    upsert: true,
    contentType,
    cacheControl: "31536000",
  });

  if (error) {
    console.error("Storage upload failed", { path, message: error.message });
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  if (!data?.path) {
    console.error("Storage upload returned no path", { path, data });
    throw new Error("Storage upload returned no path");
  }
}

export async function heroUpdateAction(formData: FormData) {
  const supabase = await createClient();

  const is_active = formData.get("is_active") === "on";

  const imageMain = asFile(formData.get("image_main"));
  const imageSide = asFile(formData.get("image_side"));

  const { data: existingRow, error: existingErr } = await supabase
    .from("site_hero")
    .select("image_main_path,image_side_path")
    .eq("key", "home_hero")
    .maybeSingle<{
      image_main_path: string | null;
      image_side_path: string | null;
    }>();

  if (existingErr) throw new Error(existingErr.message);

  let image_main_path = existingRow?.image_main_path ?? "hero/main.webp";
  let image_side_path = existingRow?.image_side_path ?? "hero/side.webp";

  if (imageMain && imageMain.size > 0) {
    const newPath = uniqueHeroPath("main");
    const processed = await processHeroImage(imageMain, "main");
    await uploadHeroImageBytes(processed.buffer, newPath, processed.contentType);
    image_main_path = newPath;
  }

  if (imageSide && imageSide.size > 0) {
    const newPath = uniqueHeroPath("side");
    const processed = await processHeroImage(imageSide, "side");
    await uploadHeroImageBytes(processed.buffer, newPath, processed.contentType);
    image_side_path = newPath;
  }

  const payload = {
    key: "home_hero" as const,
    is_active,

    image_main_path,
    image_side_path,

    main_image_label_en: isString(formData.get("main_image_label_en"))
      ? formData.get("main_image_label_en")
      : "",
    main_image_label_ka: isString(formData.get("main_image_label_ka"))
      ? formData.get("main_image_label_ka")
      : "",

    main_card_label_en: isString(formData.get("main_card_label_en"))
      ? formData.get("main_card_label_en")
      : "",
    main_card_label_ka: isString(formData.get("main_card_label_ka"))
      ? formData.get("main_card_label_ka")
      : "",
    title_en: isString(formData.get("title_en")) ? formData.get("title_en") : "",
    title_ka: isString(formData.get("title_ka")) ? formData.get("title_ka") : "",

    subtitle_en: isString(formData.get("subtitle_en"))
      ? formData.get("subtitle_en")
      : "",
    subtitle_ka: isString(formData.get("subtitle_ka"))
      ? formData.get("subtitle_ka")
      : "",

    cta_primary_href: normalizePath(
      (() => {
        const value = formData.get("cta_primary_href");
        return isString(value) ? value : "";
      })(),
    ),
    cta_secondary_href: normalizePath(
      (() => {
        const value = formData.get("cta_secondary_href");
        return isString(value) ? value : "";
      })(),
    ),

    info_tag_en: isString(formData.get("info_tag_en")) ? formData.get("info_tag_en") : "",
    info_tag_ka: isString(formData.get("info_tag_ka")) ? formData.get("info_tag_ka") : "",

    info_title_en: isString(formData.get("info_title_en"))
      ? formData.get("info_title_en")
      : "",
    info_title_ka: isString(formData.get("info_title_ka"))
      ? formData.get("info_title_ka")
      : "",

    info_subtitle_en: isString(formData.get("info_subtitle_en"))
      ? formData.get("info_subtitle_en")
      : "",
    info_subtitle_ka: isString(formData.get("info_subtitle_ka"))
      ? formData.get("info_subtitle_ka")
      : "",

    details_label_en: isString(formData.get("details_label_en"))
      ? formData.get("details_label_en")
      : "",
    details_label_ka: isString(formData.get("details_label_ka"))
      ? formData.get("details_label_ka")
      : "",
  };

  const { error } = await supabase.from("site_hero").upsert(payload);
  if (error) throw new Error(error.message);

  redirect(`./?saved=1&v=${Date.now()}`);
}