// src/app/[locale]/admin/products/[parentCode]/_components/ProductEditorClient.tsx
"use client";

import React, { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Type,
  Layers,
  Box,
} from "lucide-react";

import type { AdminParentProduct, Photo } from "../_types/productDetail";
import { computeReadyFromDraft } from "../_types/productDetail";
import {
  saveProductContentAction,
  setProductPublishedAction,
} from "../_actions/product";
import PhotoEditor from "./PhotoEditor";

export default function ProductEditorClient({
  locale,
  row,
}: {
  locale: string;
  row: AdminParentProduct;
}) {
  const [pending, startTransition] = useTransition();

  const [titleKa, setTitleKa] = useState(row.title_ka ?? "");
  const [titleEn, setTitleEn] = useState(row.title_en ?? "");
  const [descKa, setDescKa] = useState(row.description_ka ?? "");
  const [descEn, setDescEn] = useState(row.description_en ?? "");
  const [photos, setPhotos] = useState<Photo[]>(row.photos ?? []);
  const [published, setPublished] = useState<boolean>(Boolean(row.is_published));

  const ready = useMemo(
    () =>
      computeReadyFromDraft({
        title_ka: titleKa,
        title_en: titleEn,
        description_ka: descKa,
        description_en: descEn,
        photos,
      }),
    [titleKa, titleEn, descKa, descEn, photos],
  );

  const group = row.group_name_en ?? row.group_name_ka ?? row.group_name ?? "—";
  const price =
    row.min_price == null
      ? "—"
      : row.max_price != null && row.max_price !== row.min_price
        ? `${row.min_price}–${row.max_price}`
        : `${row.min_price}`;

  async function doSave(): Promise<boolean> {
    const res = await saveProductContentAction(locale, {
      parentCode: row.parent_code,
      title_ka: titleKa.trim() ? titleKa.trim() : null,
      title_en: titleEn.trim() ? titleEn.trim() : null,
      description_ka: descKa.trim() ? descKa.trim() : null,
      description_en: descEn.trim() ? descEn.trim() : null,
      photos,
    });

    if (!res.ok) {
      toast.error(res.error);
      return false;
    }
    toast.success("Draft saved successfully");
    return true;
  }

  const handleSave = () => {
    startTransition(async () => {
      toast.loading("Saving changes...", { id: "save" });
      try {
        await doSave();
      } finally {
        toast.dismiss("save");
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      toast.loading("Publishing product...", { id: "pub" });
      try {
        const saved = await doSave();
        if (!saved) return;

        const res = await setProductPublishedAction(locale, row.parent_code, true);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }

        setPublished(true);
        toast.success("Product is now live!");
      } finally {
        toast.dismiss("pub");
      }
    });
  };

  const handleHide = () => {
    startTransition(async () => {
      toast.loading("Hiding product...", { id: "hide" });
      try {
        const res = await setProductPublishedAction(locale, row.parent_code, false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setPublished(false);
        toast.success("Product is now hidden");
      } finally {
        toast.dismiss("hide");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  {row.parent_code}
                </h2>
                <span className="hidden h-5 w-px bg-zinc-300 sm:block" />
                <p className="text-lg font-medium text-zinc-600">{row.name}</p>
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                  {group}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  Stock:{" "}
                  <span className="font-medium text-zinc-700">
                    {row.total_stock ?? 0}
                  </span>
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-700">Price: {price}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>

            {published ? (
              <button
                type="button"
                disabled={pending}
                onClick={handleHide}
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4" />
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || !ready}
                onClick={handlePublish}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 disabled:bg-zinc-300"
              >
                <Eye className="h-4 w-4" />
                Publish Live
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-zinc-100 pt-5">
          <Checklist
            ready={ready}
            photos={photos}
            titleKa={titleKa}
            titleEn={titleEn}
            descKa={descKa}
            descEn={descEn}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <SectionHeader title="Georgian Content" badge="KA" icon={<Type className="h-4 w-4" />} />
          <div className="space-y-4">
            <Field label="Product Title" value={titleKa} onChange={setTitleKa} placeholder="მაგ: შავი მაისური..." />
            <TextArea label="Description" value={descKa} onChange={setDescKa} placeholder="პროდუქტის დეტალური აღწერა..." />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <SectionHeader title="English Content" badge="EN" icon={<Type className="h-4 w-4" />} />
          <div className="space-y-4">
            <Field label="Product Title" value={titleEn} onChange={setTitleEn} placeholder="e.g. Black T-Shirt..." />
            <TextArea label="Description" value={descEn} onChange={setDescEn} placeholder="Detailed product description..." />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <ImageIcon className="h-4 w-4 text-zinc-500" />
            Media Gallery
          </div>
        </div>
        <div className="p-6">
          <PhotoEditor photos={photos} setPhotos={setPhotos} parentCode={row.parent_code} locale={locale} />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4 text-sm font-semibold text-zinc-900">
          Available Variants
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(row.variants ?? []).map((v) => (
              <div
                key={`${v.code ?? "x"}-${v.size ?? "x"}`}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition hover:border-zinc-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm ring-1 ring-zinc-200">
                    {v.size ?? "-"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{v.code}</div>
                    <div className="text-xs text-zinc-500">SKU</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-zinc-900">{v.stock ?? 0}</div>
                  <div className="text-xs text-zinc-500">In Stock</div>
                </div>
              </div>
            ))}
            {(row.variants ?? []).length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-zinc-500">
                No variants found for this product.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** --- UI helpers (same as yours) --- */

function SectionHeader({
  title,
  icon,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
        <span className="text-zinc-400">{icon}</span>
        {title}
      </div>
      {badge && (
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
          {badge}
        </span>
      )}
    </div>
  );
}

function Checklist({
  ready,
  photos,
  titleKa,
  titleEn,
  descKa,
  descEn,
}: {
  ready: boolean;
  photos: Photo[];
  titleKa: string;
  titleEn: string;
  descKa: string;
  descEn: string;
}) {
  const hasPhotos = photos.length > 0;
  const hasTitle = titleKa.trim().length > 0 && titleEn.trim().length > 0;
  const hasDesc = descKa.trim().length > 0 && descEn.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className={`flex h-2 w-2 rounded-full ${ready ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span className="text-sm font-medium text-zinc-700">
          {ready ? "Ready for Publication" : "Draft Incomplete"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <CheckItem ok={hasPhotos} label="Photos" />
        <CheckItem ok={hasTitle} label="Titles" />
        <CheckItem ok={hasDesc} label="Descriptions" />
      </div>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          : "bg-zinc-100 text-zinc-500"
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-300" />}
      {label}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</span>
      <input
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-500">{label}</span>
      <textarea
        className="min-h-30 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
