"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Save,
  ImageIcon,
} from "lucide-react";
import type { ColorRow } from "@/types/catalog";
import type { ProductImageRow, ProductColorImageRow } from "@/types/product";
import { productImagesAction, type ProductImagesState } from "./imageActions";
import { cx, moveInArray, labelForLocale } from "@/lib/helpers";

const initialState: ProductImagesState = { ok: false };

function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cx(
        className,
        (pending || disabled) && "opacity-60 cursor-not-allowed"
      )}
    >
      {pending ? <span className="animate-pulse">...</span> : children}
    </button>
  );
}

function UploadZone({
  name,
  multiple = false,
}: {
  name: string;
  multiple?: boolean;
}) {
  const [fileName, setFileName] = React.useState<string | null>(null);

  return (
    <label
      className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors group ${
        fileName
          ? "border-emerald-300 bg-emerald-50"
          : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400"
      }`}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-zinc-500 group-hover:text-zinc-600">
        {fileName ? (
          <>
            <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">{fileName}</p>
            <p className="text-[10px] text-emerald-600/70 mt-1">
              Ready to upload
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              {multiple ? "Upload Images" : "Upload Image"}
            </p>
          </>
        )}
      </div>
      <input
        type="file"
        name={name}
        multiple={multiple}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            setFileName(`${e.target.files.length} file(s) selected`);
          } else {
            setFileName(null);
          }
        }}
      />
    </label>
  );
}

function CompactFileUploader({ name, label }: { name: string; label: string }) {
  const [fileName, setFileName] = React.useState<string | null>(null);

  return (
    <label
      className={`flex items-center justify-between gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer transition-colors w-full ${
        fileName
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-white border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 text-zinc-500"
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {fileName ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <Plus className="w-4 h-4 shrink-0" />
        )}
        <span className="text-xs font-medium truncate">
          {fileName || label}
        </span>
      </div>
      <input
        type="file"
        name={name}
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            setFileName(`${e.target.files.length} selected`);
          } else {
            setFileName(null);
          }
        }}
      />
      {fileName && (
        <span className="text-[10px] uppercase font-bold tracking-wider">
          Ready
        </span>
      )}
    </label>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function ImageManager({
  locale,
  productId,
  primaryImageUrl,
  gallery,
  colorImages,
  colors,
}: {
  locale: string;
  productId: string;
  primaryImageUrl: string | null;
  gallery: ProductImageRow[];
  colorImages: ProductColorImageRow[];
  colors: ColorRow[];
}) {
  const router = useRouter();
  const action = productImagesAction.bind(null, locale, productId);
  const [state, formAction] = useActionState(action, initialState);

  const [resetKey, setResetKey] = React.useState(0);

  React.useEffect(() => {
    if (state.ok) {
      router.refresh();
      setResetKey((prev) => prev + 1);
    }
  }, [state.ok, router]);

  const [galleryOrder, setGalleryOrder] = React.useState<string[]>([]);

  React.useEffect(() => {
    setGalleryOrder(
      (gallery ?? [])
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((g) => g.storage_path)
    );
  }, [gallery]);

  const [colorOrder, setColorOrder] = React.useState<Record<string, string[]>>(
    {}
  );

  const galleryByPath = React.useMemo(() => {
    const m = new Map<string, ProductImageRow>();
    for (const g of gallery ?? []) m.set(g.storage_path, g);
    return m;
  }, [gallery]);

  const colorIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const c of colors) set.add(c.id);
    for (const ci of colorImages ?? []) set.add(ci.color_id);
    return Array.from(set);
  }, [colors, colorImages]);

  const colorById = React.useMemo(() => {
    const m = new Map<string, ColorRow>();
    for (const c of colors ?? []) m.set(c.id, c);
    return m;
  }, [colors]);

  const colorImgsById = React.useMemo(() => {
    const m = new Map<string, ProductColorImageRow[]>();
    for (const ci of colorImages ?? []) {
      const arr = m.get(ci.color_id) ?? [];
      arr.push(ci);
      m.set(ci.color_id, arr);
    }
    for (const [k, arr] of m) {
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      m.set(k, arr);
    }
    return m;
  }, [colorImages]);

  React.useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const id of colorIds) {
      const rows = colorImgsById.get(id) ?? [];
      next[id] = rows.map((r) => r.storage_path);
    }
    setColorOrder(next);
  }, [colorIds, colorImgsById]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* Alert Banner */}
      {state.message && (
        <div
          className={cx(
            "rounded-xl border p-4 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          )}
        >
          {state.ok ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <div className="font-medium pt-0.5">{state.message}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Primary Image --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden sticky top-6">
            <SectionHeader
              title="Primary Image"
              sub="Used on cards and listings"
            />
            <div className="p-6 space-y-6">
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 group">
                {primaryImageUrl ? (
                  <>
                    <Image
                      src={primaryImageUrl}
                      alt="Primary"
                      fill
                      sizes="(min-width: 1024px) 300px, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <form action={formAction}>
                        <input
                          type="hidden"
                          name="_intent"
                          value="primary_delete"
                        />
                        <SubmitButton className="px-4 py-2 bg-white text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50">
                          Remove Image
                        </SubmitButton>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                    <ImageIcon className="w-10 h-10" />
                    <span className="text-xs font-medium">No Image Set</span>
                  </div>
                )}
              </div>

              <form action={formAction} className="space-y-3">
                <input type="hidden" name="_intent" value="primary_upload" />

                <UploadZone name="primary_image" key={`primary-${resetKey}`} />

                <SubmitButton className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  Set Primary
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>

        {/* --- Gallery & Colors --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between pr-4">
              <SectionHeader
                title="General Gallery"
                sub="Additional product angles"
              />
              {galleryOrder.length > 0 && (
                <form action={formAction}>
                  <input type="hidden" name="_intent" value="gallery_reorder" />
                  <input
                    type="hidden"
                    name="order_json"
                    value={JSON.stringify(galleryOrder)}
                  />
                  <SubmitButton className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    Save Order
                  </SubmitButton>
                </form>
              )}
            </div>

            <div className="p-6 space-y-6">
              {galleryOrder.length === 0 ? (
                <div className="text-sm text-zinc-500 italic text-center py-8 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  No gallery images uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {galleryOrder.map((path, idx) => {
                    const row = galleryByPath.get(path);
                    if (!row) return null;
                    return (
                      <div
                        key={path}
                        className="group relative aspect-square rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm"
                      >
                        <Image
                          src={row.url}
                          alt="Gallery"
                          fill
                          sizes="(min-width: 1024px) 20vw, 50vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <span className="absolute top-2 left-2 text-[10px] font-mono text-white/70 bg-black/30 px-1 rounded">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryOrder((prev) =>
                                  moveInArray(prev, path, -1)
                                )
                              }
                              disabled={idx === 0}
                              className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/30 disabled:opacity-20 transition-colors"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setGalleryOrder((prev) =>
                                  moveInArray(prev, path, 1)
                                )
                              }
                              disabled={idx === galleryOrder.length - 1}
                              className="p-1.5 rounded-md bg-white/10 text-white hover:bg-white/30 disabled:opacity-20 transition-colors"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                          <form action={formAction} className="mt-1">
                            <input
                              type="hidden"
                              name="_intent"
                              value="gallery_delete"
                            />
                            <input
                              type="hidden"
                              name="storage_path"
                              value={path}
                            />
                            <SubmitButton className="p-1.5 rounded-md bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </SubmitButton>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <form
                action={formAction}
                className="space-y-3 pt-4 border-t border-zinc-100"
              >
                <input type="hidden" name="_intent" value="gallery_upload" />
                <div className="flex gap-4">
                  <div className="flex-1">
                    {/* Key Prop Reset Pattern */}
                    <UploadZone
                      name="gallery_images"
                      multiple
                      key={`gallery-${resetKey}`}
                    />
                  </div>
                  <SubmitButton className="h-32 px-6 rounded-xl bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 shadow-sm flex flex-col items-center justify-center gap-2">
                    <Plus className="w-6 h-6" />
                    <span>Upload</span>
                  </SubmitButton>
                </div>
              </form>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <SectionHeader
              title="Color Variations"
              sub="Images specific to a selected color variant"
            />
            <div className="p-6 space-y-8">
              {colorIds.length === 0 ? (
                <div className="text-sm text-zinc-500 text-center">
                  No color variants found for this product.
                </div>
              ) : (
                <div className="space-y-8">
                  {colorIds.map((colorId) => {
                    const meta = colorById.get(colorId);
                    const title = meta
                      ? labelForLocale(locale, {
                          name_en: meta.name_en,
                          name_ka: meta.name_ka,
                        })
                      : colorId;
                    const hex = meta?.hex ?? "#e4e4e7";
                    const order = colorOrder[colorId] ?? [];
                    const rows = (colorImgsById.get(colorId) ?? []).reduce(
                      (m, r) => {
                        m.set(r.storage_path, r);
                        return m;
                      },
                      new Map<string, ProductColorImageRow>()
                    );

                    return (
                      <div
                        key={colorId}
                        className="rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50/30"
                      >
                        <div className="px-4 py-3 bg-white border-b border-zinc-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="w-6 h-6 rounded-full border border-zinc-200 shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: hex }}
                            />
                            <span className="text-sm font-bold text-zinc-900">
                              {title}
                            </span>
                          </div>
                          {order.length > 0 && (
                            <form action={formAction}>
                              <input
                                type="hidden"
                                name="_intent"
                                value="color_reorder"
                              />
                              <input
                                type="hidden"
                                name="color_id"
                                value={colorId}
                              />
                              <input
                                type="hidden"
                                name="order_json"
                                value={JSON.stringify(order)}
                              />
                              <SubmitButton className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                Save Order
                              </SubmitButton>
                            </form>
                          )}
                        </div>

                        <div className="p-4 space-y-4">
                          {order.length === 0 ? (
                            <p className="text-xs text-zinc-400 italic">
                              No images for this color yet.
                            </p>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              {order.map((path, idx) => {
                                const row = rows.get(path);
                                if (!row) return null;
                                return (
                                  <div
                                    key={path}
                                    className="group relative aspect-square rounded-md border border-zinc-200 bg-white overflow-hidden"
                                  >
                                    <Image
                                      src={row.url}
                                      alt="Color Variant"
                                      fill
                                      sizes="150px"
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                      <div className="flex gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setColorOrder((prev) => ({
                                              ...prev,
                                              [colorId]: moveInArray(
                                                prev[colorId] ?? [],
                                                path,
                                                -1
                                              ),
                                            }))
                                          }
                                          disabled={idx === 0}
                                          className="text-white hover:text-zinc-300 disabled:opacity-30"
                                        >
                                          <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setColorOrder((prev) => ({
                                              ...prev,
                                              [colorId]: moveInArray(
                                                prev[colorId] ?? [],
                                                path,
                                                1
                                              ),
                                            }))
                                          }
                                          disabled={idx === order.length - 1}
                                          className="text-white hover:text-zinc-300 disabled:opacity-30"
                                        >
                                          <ArrowRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <form action={formAction}>
                                        <input
                                          type="hidden"
                                          name="_intent"
                                          value="color_delete"
                                        />
                                        <input
                                          type="hidden"
                                          name="color_id"
                                          value={colorId}
                                        />
                                        <input
                                          type="hidden"
                                          name="storage_path"
                                          value={path}
                                        />
                                        <SubmitButton className="text-red-400 hover:text-red-200">
                                          <Trash2 className="w-4 h-4" />
                                        </SubmitButton>
                                      </form>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <form
                            action={formAction}
                            className="flex gap-3 items-center"
                          >
                            <input
                              type="hidden"
                              name="_intent"
                              value="color_upload"
                            />
                            <input
                              type="hidden"
                              name="color_id"
                              value={colorId}
                            />
                            <div className="flex-1">
                              <CompactFileUploader
                                name="color_images"
                                label={`Add images for ${title}`}
                                key={`color-${colorId}-${resetKey}`}
                              />
                            </div>
                            <SubmitButton className="px-3 py-2 bg-zinc-900 text-white rounded-lg text-xs font-semibold hover:bg-zinc-800">
                              Upload
                            </SubmitButton>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
