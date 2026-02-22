// src/app/[locale]/(admin)/admin/site/_components/hero/heroActions.ts
"use server";

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

function extFromFile(file: File): string {
  const name = file.name || "";
  const fromName = name.includes(".") ? name.split(".").pop() : "";
  const fromType = (file.type || "").split("/")[1] || "";
  const ext = (fromName || fromType || "jpg").toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

function uniqueHeroPath(kind: "main" | "side", file: File): string {
  const ext = extFromFile(file);
  return `hero/${kind}-${Date.now()}.${ext}`;
}

async function uploadHeroImage(file: File, path: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("site")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "image/jpeg",
      cacheControl: "0",
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

  let image_main_path = existingRow?.image_main_path ?? "hero/main.jpg";
  let image_side_path = existingRow?.image_side_path ?? "hero/side.jpg";

  if (imageMain && imageMain.size > 0) {
    const newPath = uniqueHeroPath("main", imageMain);
    await uploadHeroImage(imageMain, newPath);
    image_main_path = newPath;
  }

  if (imageSide && imageSide.size > 0) {
    const newPath = uniqueHeroPath("side", imageSide);
    await uploadHeroImage(imageSide, newPath);
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
    title_en: isString(formData.get("title_en"))
      ? formData.get("title_en")
      : "",
    title_ka: isString(formData.get("title_ka"))
      ? formData.get("title_ka")
      : "",

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

    info_tag_en: isString(formData.get("info_tag_en"))
      ? formData.get("info_tag_en")
      : "",
    info_tag_ka: isString(formData.get("info_tag_ka"))
      ? formData.get("info_tag_ka")
      : "",

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
