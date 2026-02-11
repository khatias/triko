// src/app/[locale]/admin/products/[parentCode]/_components/PhotoEditor.tsx
"use client";

import React, { useMemo, useState } from "react";
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

import type { Photo } from "../_types/productDetail";
import { uploadProductPhotoAction } from "../_actions/product";

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
    .map((p) => ({ ...p, url: p.url.trim() }))
    .filter((p) => {
      if (!p.url) return false;
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    })
    .slice(0, 12);

  uniq.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

  let primaryIdx = uniq.findIndex((p) => p.is_primary);
  if (uniq.length > 0 && primaryIdx === -1) primaryIdx = 0;

  return uniq.map((p, i) => ({
    url: p.url,
    sort: i,
    is_primary: i === primaryIdx,
  }));
}

export default function PhotoEditor({
  photos,
  setPhotos,
  parentCode,
  locale,
}: {
  photos: Photo[];
  setPhotos: (v: Photo[]) => void;
  parentCode: string;
  locale: string;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const ordered = useMemo(
    () => photos.slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)),
    [photos],
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);

      const res = await uploadProductPhotoAction(locale, parentCode, fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      const next: Photo[] = [
        ...ordered,
        { url: res.data, sort: ordered.length, is_primary: ordered.length === 0 },
      ];

      setPhotos(normalizeClient(next));
      toast.success("Image uploaded successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  function handleUrlAdd() {
    const u = urlInput.trim();
    if (!isHttpUrl(u)) {
      toast.error("Please enter a valid http(s) URL");
      return;
    }

    const next: Photo[] = [
      ...ordered,
      { url: u, sort: ordered.length, is_primary: ordered.length === 0 },
    ];

    setPhotos(normalizeClient(next));
    setUrlInput("");
    toast.success("Image URL added");
  }

  function handleRemove(idx: number) {
    const next = ordered.filter((_, i) => i !== idx);
    setPhotos(normalizeClient(next));
    toast.info("Image removed");
  }

  function handleSetPrimary(idx: number) {
    const next = ordered.map((p, i) => ({ ...p, is_primary: i === idx }));
    setPhotos(normalizeClient(next));
    toast.success("Cover image updated");
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
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-4 sm:flex-row">
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 ${
            isUploading ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleFileUpload}
          />
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          <span>Upload</span>
        </label>

        <div className="flex flex-1 items-center gap-2">
          <div className="text-zinc-300">or</div>
          <div className="relative flex flex-1 items-center">
            <LinkIcon className="absolute left-3 h-4 w-4 text-zinc-400" />
            <input
              className="w-full rounded-lg border border-zinc-200 py-2.5 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder="Paste image URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlAdd()}
            />
          </div>
          <button
            type="button"
            onClick={handleUrlAdd}
            disabled={!urlInput.trim()}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            Add URL
          </button>
        </div>
      </div>

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
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 py-12 text-center text-zinc-500">
          <ImagePlus className="mb-2 h-10 w-10 opacity-20" />
          <p className="text-sm">No photos yet.</p>
          <p className="text-xs opacity-60">Upload or paste a URL to get started.</p>
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
}: {
  photo: Photo;
  index: number;
  total: number;
  onRemove: () => void;
  onSetPrimary: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={`Product ${index}`}
        className="h-full w-full object-cover"
        onError={(e) => {
          // avoid any crash, just hide image
          e.currentTarget.style.display = "none";
        }}
      />

      {/* fallback always present behind */}
      <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
        <ImagePlus className="h-6 w-6" />
        <span className="text-[10px]">Broken URL</span>
      </div>

      {photo.is_primary && (
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" />
          Cover
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20">
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
          <div className="flex items-center rounded-lg bg-white/90 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              disabled={index === 0}
              onClick={onMoveLeft}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
              title="Move Left"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-zinc-200" />
            <button
              type="button"
              disabled={index === total - 1}
              onClick={onMoveRight}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 disabled:opacity-30"
              title="Move Right"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow-sm backdrop-blur-sm transition hover:bg-red-50 hover:text-red-700"
            title="Remove Photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {!photo.is_primary && (
          <button
            type="button"
            onClick={onSetPrimary}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-400 opacity-0 shadow-sm backdrop-blur-sm transition hover:text-amber-500 group-hover:opacity-100"
            title="Set as Cover"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
