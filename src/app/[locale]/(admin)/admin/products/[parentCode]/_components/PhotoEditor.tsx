"use client";

import React, { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  Link as LinkIcon,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { Photo } from "../_types/productDetail";
import { supabase } from "@/utils/supabase/clients";

const MAX_PHOTOS = 12;

// 8MB (შეგიძლია გაზარდო, მაგრამ დიდი ფაილები ნელდება)
const MAX_BYTES = 8 * 1024 * 1024;

function isHttpUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeClient(next: Photo[]) {
  const seen = new Set<string>();
  const uniq = next
    .map((p) => ({ ...p, url: (p.url ?? "").trim() }))
    .filter((p) => {
      if (!p.url) return false;
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    })
    .slice(0, MAX_PHOTOS);

  uniq.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  let primaryIdx = uniq.findIndex((p) => p.is_primary);
  if (uniq.length > 0 && primaryIdx === -1) primaryIdx = 0;

  return uniq.map((p, i) => ({
    url: p.url,
    sort: i,
    is_primary: i === primaryIdx,
  }));
}

function safeParentFolder(parentCode: string) {
  return String(parentCode || "").replace(/[^A-Za-z0-9_-]/g, "_");
}

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/avif") return "avif";
  return "jpg";
}

async function uploadToStorage(file: File, parentCode: string) {
  if (!file) throw new Error("No file selected.");
  if (file.size <= 0) throw new Error("Empty file.");
  if (file.size > MAX_BYTES) throw new Error("Image is too large (max 8MB).");

  const mime = file.type || "image/jpeg";
  if (!mime.startsWith("image/")) throw new Error("Unsupported file type.");

  const safeParent = safeParentFolder(parentCode);
  const ext = extFromMime(mime);

  const objectPath = `products/${safeParent}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(objectPath, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: mime,
    });

  if (upErr) throw new Error(upErr.message);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(objectPath);

  const publicUrl = data?.publicUrl;
  if (!publicUrl) throw new Error("Upload succeeded but URL could not be created.");

  return publicUrl;
}

export default function PhotoEditor({
  photos,
  setPhotos,
  parentCode,
}: {
  photos: Photo[];
  setPhotos: (v: Photo[]) => void;
  parentCode: string;
}) {
  const t = useTranslations("Admin.ProductEdit.media");
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const ordered = useMemo(
    () => (photos ?? []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [photos],
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow reselect same file
    if (!file) return;

    if (ordered.length >= MAX_PHOTOS) {
      toast.error(t("max", { count: MAX_PHOTOS }));
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadToStorage(file, parentCode);

      const next: Photo[] = [
        ...ordered,
        {
          url: publicUrl,
          sort: ordered.length,
          is_primary: ordered.length === 0,
        },
      ];

      setPhotos(normalizeClient(next));
      toast.success(t("uploaded"));
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  }

  function handleUrlAdd() {
    const u = urlInput.trim();
    if (!isHttpUrl(u)) {
      toast.error(t("badUrl"));
      return;
    }

    if (ordered.length >= MAX_PHOTOS) {
      toast.error(t("max", { count: MAX_PHOTOS }));
      return;
    }

    const next: Photo[] = [
      ...ordered,
      { url: u, sort: ordered.length, is_primary: ordered.length === 0 },
    ];

    setPhotos(normalizeClient(next));
    setUrlInput("");
    toast.success(t("urlAdded"));
  }

  function handleRemove(idx: number) {
    const next = ordered.filter((_, i) => i !== idx);
    setPhotos(normalizeClient(next));
    toast.info(t("removed"));
  }

  function handleSetPrimary(idx: number) {
    const next = ordered.map((p, i) => ({ ...p, is_primary: i === idx }));
    setPhotos(normalizeClient(next));
    toast.success(t("coverUpdated"));
  }

  function handleMove(idx: number, dir: "left" | "right") {
    if (dir === "left" && idx === 0) return;
    if (dir === "right" && idx === ordered.length - 1) return;

    const targetIdx = dir === "left" ? idx - 1 : idx + 1;
    const next = [...ordered];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setPhotos(normalizeClient(next));
  }

  return (
    <div className="space-y-6">
      {/* Upload / URL bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-950 sm:flex-row sm:items-center">
        {/* IMPORTANT: button type="button" => never submits any form */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileRef.current?.click()}
          className={`flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 ${
            isUploading ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          <span>{t("upload")}</span>
        </button>

        {/* CRITICAL: name="" + form="" prevents file being attached to any server action form submit */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
          name=""
          form=""
        />

        <div className="flex flex-1 items-center gap-2">
          <div className="text-zinc-300 dark:text-zinc-700">{t("or")}</div>

          <div className="relative flex flex-1 items-center">
            <LinkIcon className="absolute left-3 h-4 w-4 text-zinc-400" />
            <input
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-200 dark:focus:ring-zinc-200"
              placeholder={t("urlPh")}
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            />
          </div>

          <button
            type="button"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim()}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t("addUrl")}
          </button>
        </div>
      </div>

      {/* Grid */}
      {ordered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {ordered.map((photo, idx) => (
            <PhotoCard
              key={`${photo.url}-${idx}`}
              photo={photo}
              index={idx}
              total={ordered.length}
              onRemove={() => handleRemove(idx)}
              onSetPrimary={() => handleSetPrimary(idx)}
              onMoveLeft={() => handleMove(idx, "left")}
              onMoveRight={() => handleMove(idx, "right")}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 py-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <ImagePlus className="mb-2 h-10 w-10 opacity-20" />
          <p className="text-sm">{t("empty")}</p>
          <p className="text-xs opacity-60">{t("emptyHint")}</p>
        </div>
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  index,
  total,
  onRemove,
  onSetPrimary,
  onMoveLeft,
  onMoveRight,
  t,
}: {
  photo: Photo;
  index: number;
  total: number;
  onRemove: () => void;
  onSetPrimary: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  t: (key: string, values?: Record<string, number>) => string;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      {!broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={t("imgAlt", { index: index + 1 })}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-300">
          <ImagePlus className="h-6 w-6" />
          <span className="text-[10px]">{t("broken")}</span>
        </div>
      )}

      {photo.is_primary && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" />
          {t("cover")}
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20">
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
          <div className="flex items-center rounded-lg bg-white/90 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveLeft}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-200 dark:hover:text-white"
              title={t("moveLeft")}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveRight}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-200 dark:hover:text-white"
              title={t("moveRight")}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-700 dark:bg-zinc-900/90 dark:hover:bg-red-950/40"
            title={t("remove")}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {!photo.is_primary && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-400 opacity-0 shadow-sm backdrop-blur-sm transition hover:text-amber-500 group-hover:opacity-100 dark:bg-zinc-900/90"
            title={t("setCover")}
          >
            <Star className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}