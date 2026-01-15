/* eslint-disable @next/next/no-img-element */
"use client";

"use client";

import * as React from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { createProductAction } from "./actions/createProduct";
import type { CreateProductState } from "./actions/createProduct";
import type { CategoryRow, ColorRow, SizeRow } from "@/types/catalog";
import { parseIndentedLabel } from "@/lib/helpers";
import {
  CreateProductFormSchema,
  type CreateProductFormInput,
  PRODUCT_STATUSES,
} from "@/lib/validation/product";

const initialState: CreateProductState = { ok: false, message: "" };

function isFieldKey(k: string): k is keyof CreateProductFormInput {
  return [
    "status",
    "name_en",
    "name_ka",
    "slug",
    "price_cents",
    "description_en",
    "description_ka",
    "category_ids",
    "color_ids",
    "size_ids",
  ].includes(k);
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fileListToArray(list: FileList | null): File[] {
  if (!list) return [];
  return Array.from(list);
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return url;
}

export default function NewProductForm({
  locale,
  categories,
  colors,
  sizes,
}: {
  locale: string;
  categories: CategoryRow[];
  colors: ColorRow[];
  sizes: SizeRow[];
}) {
  const action = createProductAction.bind(null, locale);
  const [state, formAction, pending] = useActionState<CreateProductState, FormData>(
    action,
    initialState
  );

  const {
    register,
    trigger,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors, touchedFields, isSubmitted, isValid },
  } = useForm({
    resolver: zodResolver(CreateProductFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      status: "draft",
      name_en: "",
      name_ka: "",
      slug: "",
      price_cents: "",
      description_en: "",
      description_ka: "",
      category_ids: [],
      color_ids: [],
      size_ids: [],
    },
  });

const watchedColorIds = watch("color_ids");

const selectedColorSet = React.useMemo(() => {
  const ids = Array.isArray(watchedColorIds) ? watchedColorIds : [];
  return new Set(ids);
}, [watchedColorIds]);

// const selectedColorIds = Array.isArray(watchedColorIds) ? watchedColorIds : [];


  const [showBanner, setShowBanner] = React.useState(false);
  React.useEffect(() => {
    if (state.message) setShowBanner(true);
  }, [state.message]);

  // Map server issues -> RHF errors
  React.useEffect(() => {
    if (state.ok) return;
    if (!state.issues?.length) return;

    for (const issue of state.issues) {
      const rootKey = issue.path.split(".")[0] ?? issue.path;
      if (isFieldKey(rootKey)) {
        setError(rootKey, { type: "server", message: issue.message });
      }
    }
  }, [state.ok, state.issues, setError]);

  // Reset after success
  React.useEffect(() => {
    if (!state.ok) return;
    reset({
      status: "draft",
      name_en: "",
      name_ka: "",
      slug: "",
      price_cents: "",
      description_en: "",
      description_ka: "",
      category_ids: [],
      color_ids: [],
      size_ids: [],
    });
  }, [state.ok, reset]);

  const showErr = <K extends keyof CreateProductFormInput>(k: K) => {
    const has = Boolean(errors[k]?.message);
    const touched = Boolean((touchedFields as Partial<Record<K, boolean>>)[k]);
    return has && (touched || isSubmitted);
  };

  const errMsg = <K extends keyof CreateProductFormInput>(k: K) =>
    (errors[k]?.message as string | undefined) ?? null;

  // Image previews (client-side only)
  const [primaryFile, setPrimaryFile] = React.useState<File | null>(null);
  const primaryUrl = useObjectUrl(primaryFile);

  const [galleryFiles, setGalleryFiles] = React.useState<File[]>([]);
  const [galleryUrls, setGalleryUrls] = React.useState<string[]>([]);
  React.useEffect(() => {
    // cleanup previous
    for (const u of galleryUrls) URL.revokeObjectURL(u);
    const next = galleryFiles.map((f) => URL.createObjectURL(f));
    setGalleryUrls(next);
    return () => {
      for (const u of next) URL.revokeObjectURL(u);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryFiles]);

  const [colorUrls, setColorUrls] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    // cleanup on unmount
    return () => {
      for (const arr of Object.values(colorUrls)) {
        for (const u of arr) URL.revokeObjectURL(u);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setColorPreviews(colorId: string, files: File[]) {
    setColorUrls((prev) => {
      // cleanup old urls for this color
      for (const u of prev[colorId] ?? []) URL.revokeObjectURL(u);
      const next = files.map((f) => URL.createObjectURL(f));
      return { ...prev, [colorId]: next };
    });
  }

  return (
    <form
      action={formAction}
      noValidate
      onChange={() => setShowBanner(false)}
      onSubmit={async (e) => {
        const ok = await trigger();
        if (!ok) e.preventDefault();
      }}
      className="max-w-6xl mx-auto pb-20"
    >
      {showBanner && state.message ? (
        <div
          className={cx(
            "my-6 rounded-md border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          <strong>{state.message}</strong>
        </div>
      ) : null}

      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Add New Product
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new product. Fix only the red fields.
          </p>
        </div>

        <button
          type="submit"
          disabled={pending || !isValid}
          className={cx(
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
            pending || !isValid
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800"
          )}
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : !isValid ? (
            "Fill required fields"
          ) : (
            "Save Product"
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-8">
          {/* General */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-semibold text-gray-900">
              General Information
            </h2>

            {/* status */}
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Status
              </label>
              <select
                {...register("status", {
                  onChange: () => clearErrors("status"),
                })}
                disabled={pending}
                className={cx(
                  "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                  showErr("status")
                    ? "ring-red-300 focus:ring-red-500"
                    : "ring-gray-300 focus:ring-indigo-600"
                )}
              >
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {showErr("status") ? (
                <p className="mt-1 text-xs text-red-600">{errMsg("status")}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* price */}
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Price (cents)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1000 (= $10.00)"
                  {...register("price_cents", {
                    onChange: () => clearErrors("price_cents"),
                  })}
                  disabled={pending}
                  className={cx(
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("price_cents")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600"
                  )}
                />
                {showErr("price_cents") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errMsg("price_cents")}
                  </p>
                ) : null}
              </div>

              {/* slug */}
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="my-new-product"
                  {...register("slug", { onChange: () => clearErrors("slug") })}
                  disabled={pending}
                  className={cx(
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("slug")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600"
                  )}
                />
                {showErr("slug") ? (
                  <p className="mt-1 text-xs text-red-600">{errMsg("slug")}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EN */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">English</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  EN
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Name (EN)
                </label>
                <input
                  type="text"
                  {...register("name_en", { onChange: () => clearErrors("name_en") })}
                  disabled={pending}
                  className={cx(
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("name_en")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600"
                  )}
                />
                {showErr("name_en") ? (
                  <p className="mt-1 text-xs text-red-600">{errMsg("name_en")}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Description (EN)
                </label>
                <textarea
                  rows={4}
                  {...register("description_en", {
                    onChange: () => clearErrors("description_en"),
                  })}
                  disabled={pending}
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* KA */}
            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Georgian</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  KA
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Name (KA)
                </label>
                <input
                  type="text"
                  {...register("name_ka", { onChange: () => clearErrors("name_ka") })}
                  disabled={pending}
                  className={cx(
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("name_ka")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600"
                  )}
                />
                {showErr("name_ka") ? (
                  <p className="mt-1 text-xs text-red-600">{errMsg("name_ka")}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Description (KA)
                </label>
                <textarea
                  rows={4}
                  {...register("description_ka", {
                    onChange: () => clearErrors("description_ka"),
                  })}
                  disabled={pending}
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Images</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Upload a primary image, optional gallery images, and optional images per color.
                </p>
              </div>
              <span className="text-xs text-gray-500">PNG, JPG, WebP</span>
            </div>

            {/* Primary + Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Primary image
                  </label>
                  <span className="text-xs text-gray-500">1 file</span>
                </div>

                <label
                  className={cx(
                    "mt-3 block rounded-lg border border-dashed p-4 text-sm",
                    "cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors",
                    pending && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="text-gray-700 font-medium">Click to choose</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Best as square or 4:5 crop
                  </div>
                  <input
                    name="primary_image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={pending}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.currentTarget.files?.[0] ?? null;
                      setPrimaryFile(f);
                    }}
                  />
                </label>

                {primaryUrl ? (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">Preview</div>
                    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                      
                      <img
                        src={primaryUrl}
                        alt="Primary preview"
                        className="h-48 w-full object-cover"
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Gallery */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Gallery images
                  </label>
                  <span className="text-xs text-gray-500">multiple</span>
                </div>

                <label
                  className={cx(
                    "mt-3 block rounded-lg border border-dashed p-4 text-sm",
                    "cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors",
                    pending && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="text-gray-700 font-medium">Click to choose</div>
                  <div className="text-xs text-gray-500 mt-1">
                    You can select multiple files
                  </div>
                  <input
                    name="gallery_images"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    disabled={pending}
                    className="sr-only"
                    onChange={(e) => {
                      setGalleryFiles(fileListToArray(e.currentTarget.files));
                    }}
                  />
                </label>

                {galleryUrls.length > 0 ? (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">
                      Preview ({galleryUrls.length})
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {galleryUrls.slice(0, 8).map((u) => (
                        <div
                          key={u}
                          className="overflow-hidden rounded-md border border-gray-200 bg-white"
                        >
                          <img src={u} alt="Gallery preview" className="h-16 w-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {galleryUrls.length > 8 ? (
                      <div className="mt-2 text-xs text-gray-500">
                        + {galleryUrls.length - 8} more
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Color specific */}
            <div className="pt-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Color variants</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Select colors below. If you want color specific images, upload them inside the selected color card.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {colors.map((c) => {
                  const selected = selectedColorSet.has(c.id);
                  const name = c.name_en || c.name_ka || c.code;
                  const previews = colorUrls[c.id] ?? [];

                  return (
                    <div
                      key={c.id}
                      className={cx(
                        "rounded-xl border p-4 transition-colors",
                        selected
                          ? "border-indigo-200 bg-indigo-50/40"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      )}
                    >
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          value={c.id}
                          {...register("color_ids", {
                            onChange: () => clearErrors("color_ids"),
                          })}
                          disabled={pending}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span
                          className="h-8 w-8 rounded-full border border-gray-200 shadow-sm"
                          style={{ backgroundColor: c.hex || "#ccc" }}
                          title={c.code}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {name}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">{c.code}</div>
                        </div>
                      </label>

                      {selected ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium text-gray-700">
                              Color images (optional)
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {previews.length ? `${previews.length} selected` : "none"}
                            </div>
                          </div>

                          <label
                            className={cx(
                              "mt-2 block rounded-lg border border-dashed p-3 text-xs",
                              "cursor-pointer bg-white hover:bg-gray-50 transition-colors",
                              pending && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <div className="text-gray-700 font-medium">Upload images for this color</div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              These images will be shown when this color is chosen.
                            </div>
                            <input
                              name={`color_images_${c.id}`}
                              type="file"
                              multiple
                              accept="image/png,image/jpeg,image/webp"
                              disabled={pending}
                              className="sr-only"
                              onChange={(e) => {
                                const files = fileListToArray(e.currentTarget.files);
                                setColorPreviews(c.id, files);
                              }}
                            />
                          </label>

                          {previews.length > 0 ? (
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {previews.slice(0, 8).map((u) => (
                                <div
                                  key={u}
                                  className="overflow-hidden rounded-md border border-gray-200 bg-white"
                                >
                                  <img
                                    src={u}
                                    alt="Color preview"
                                    className="h-14 w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {showErr("color_ids") ? (
                <p className="mt-2 text-xs text-red-600">{errMsg("color_ids")}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          {/* Categories */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Categories
            </h3>

            <div className="max-h-[320px] overflow-y-auto pr-2">
              {categories.map((c) => {
                const rawLabel = c.name_en || c.name_ka || "Unknown";
                const { depth, text } = parseIndentedLabel(rawLabel);

                return (
                  <label
                    key={c.id}
                    className="flex items-center py-2 hover:bg-gray-50 rounded px-2 cursor-pointer"
                  >
                    <div style={{ width: depth * 16 }} />
                    <input
                      type="checkbox"
                      value={c.id}
                      {...register("category_ids", {
                        onChange: () => clearErrors("category_ids"),
                      })}
                      disabled={pending}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="ml-3 text-sm text-gray-800">{text}</span>
                  </label>
                );
              })}
            </div>

            {showErr("category_ids") ? (
              <p className="mt-2 text-xs text-red-600">{errMsg("category_ids")}</p>
            ) : null}
          </div>

          {/* Sizes */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sizes</h3>

            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <label key={s.id} className="cursor-pointer">
                  <input
                    type="checkbox"
                    value={s.id}
                    {...register("size_ids", {
                      onChange: () => clearErrors("size_ids"),
                    })}
                    disabled={pending}
                    className="peer sr-only"
                  />
                  <span
                    className={cx(
                      "rounded-md border px-3 py-1.5 text-sm bg-white select-none transition-all",
                      showErr("size_ids") ? "border-red-300" : "border-gray-200",
                      "peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700"
                    )}
                  >
                    {s.code}
                  </span>
                </label>
              ))}
            </div>

            {showErr("size_ids") ? (
              <p className="mt-2 text-xs text-red-600">{errMsg("size_ids")}</p>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
