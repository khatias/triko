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
import { useTranslations } from "next-intl";

import type { AdminParentProduct, Photo } from "../_types/productDetail";
import { computeReadyFromDraft } from "../_types/productDetail";
import {
  saveProductContentAction,
  setProductPublishedAction,
} from "../_actions/product";
import PhotoEditor from "./PhotoEditor";

function pickGroupLabel(row: AdminParentProduct, locale: string) {
  const isKa = locale === "ka";
  const ka = (row.group_name_ka ?? "").trim();
  const en = (row.group_name_en ?? "").trim();
  return isKa ? ka || en || row.group_name || "—" : en || ka || row.group_name || "—";
}

export default function ProductEditorClient({
  locale,
  row,
}: {
  locale: string;
  row: AdminParentProduct;
}) {
  const t = useTranslations("Admin.ProductEdit");
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

  const group = pickGroupLabel(row, locale);

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

    toast.success(t("toasts.saved"));
    return true;
  }

  const handleSave = () => {
    startTransition(async () => {
      toast.loading(t("toasts.saving"), { id: "save" });
      try {
        await doSave();
      } finally {
        toast.dismiss("save");
      }
    });
  };

  const handlePublish = () => {
    if (!ready) return;

    startTransition(async () => {
      toast.loading(t("toasts.publishing"), { id: "pub" });
      try {
        const saved = await doSave();
        if (!saved) return;

        const res = await setProductPublishedAction(locale, row.parent_code, true);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }

        setPublished(true);
        toast.success(t("toasts.published"));
      } finally {
        toast.dismiss("pub");
      }
    });
  };

  const handleHide = () => {
    startTransition(async () => {
      toast.loading(t("toasts.hiding"), { id: "hide" });
      try {
        const res = await setProductPublishedAction(locale, row.parent_code, false);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setPublished(false);
        toast.success(t("toasts.hidden"));
      } finally {
        toast.dismiss("hide");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
              <Box className="h-6 w-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {row.parent_code}
                </h2>
                <span className="hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />
                <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
                  {row.name}
                </p>
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {group}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-zinc-400" />
                  {t("meta.stock")}{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    {row.total_stock ?? 0}
                  </span>
                </span>

                <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />

                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-700 dark:text-zinc-200">
                    {t("meta.price")} {price}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("actions.saveDraft")}
            </button>

            {published ? (
              <button
                type="button"
                disabled={pending}
                onClick={handleHide}
                className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
              >
                <EyeOff className="h-4 w-4" />
                {t("actions.unpublish")}
              </button>
            ) : (
              <button
                type="button"
                disabled={pending || !ready}
                onClick={handlePublish}
                className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Eye className="h-4 w-4" />
                {t("actions.publish")}
              </button>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          <Checklist
            t={t}
            ready={ready}
            photos={photos}
            titleKa={titleKa}
            titleEn={titleEn}
            descKa={descKa}
            descEn={descEn}
          />
        </div>
      </div>

      {/* Content columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title={t("ka.title")}
            badge="KA"
            icon={<Type className="h-4 w-4" />}
          />
          <div className="space-y-4">
            <Field
              label={t("fields.title")}
              value={titleKa}
              onChange={setTitleKa}
              placeholder={t("ka.titlePh")}
            />
            <TextArea
              label={t("fields.description")}
              value={descKa}
              onChange={setDescKa}
              placeholder={t("ka.descPh")}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SectionHeader
            title={t("en.title")}
            badge="EN"
            icon={<Type className="h-4 w-4" />}
          />
          <div className="space-y-4">
            <Field
              label={t("fields.title")}
              value={titleEn}
              onChange={setTitleEn}
              placeholder={t("en.titlePh")}
            />
            <TextArea
              label={t("fields.description")}
              value={descEn}
              onChange={setDescEn}
              placeholder={t("en.descPh")}
            />
          </div>
        </div>
      </div>

      {/* Photos */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <ImageIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
            {t("media.title")}
          </div>
        </div>
        <div className="p-6">
   <PhotoEditor photos={photos} setPhotos={setPhotos} parentCode={row.parent_code} />
        </div>
      </div>

      {/* Variants */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-6 py-4 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
          {t("variants.title")}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(row.variants ?? []).map((v) => (
              <div
                key={`${v.code ?? "x"}-${v.size ?? "x"}`}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                    {v.size ?? "-"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {v.code}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t("variants.sku")}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {v.stock ?? 0}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t("variants.inStock")}
                  </div>
                </div>
              </div>
            ))}

            {(row.variants ?? []).length === 0 && (
              <div className="col-span-full py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {t("variants.empty")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** --- UI helpers --- */

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
    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        <span className="text-zinc-400">{icon}</span>
        {title}
      </div>
      {badge && (
        <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
          {badge}
        </span>
      )}
    </div>
  );
}

function Checklist({
  t,
  ready,
  photos,
  titleKa,
  titleEn,
  descKa,
  descEn,
}: {
  t: (key: string, values?: Record<string, number>) => string;
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
        <span
          className={`flex h-2 w-2 rounded-full ${
            ready ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {ready ? t("checklist.ready") : t("checklist.incomplete")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <CheckItem ok={hasPhotos} label={t("checklist.photos")} />
        <CheckItem ok={hasTitle} label={t("checklist.titles")} />
        <CheckItem ok={hasDesc} label={t("checklist.descriptions")} />
      </div>
    </div>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-200"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-zinc-300 dark:border-zinc-600" />
      )}
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
      <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <input
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-200 dark:focus:bg-zinc-900 dark:focus:ring-zinc-200"
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
      <span className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <textarea
        className="min-h-30 w-full rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 py-2.5 text-sm text-zinc-900 transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-200 dark:focus:bg-zinc-900 dark:focus:ring-zinc-200"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
