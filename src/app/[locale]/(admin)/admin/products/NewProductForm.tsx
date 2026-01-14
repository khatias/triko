// src/app/[locale]/(admin)/admin/products/new/NewProductForm.tsx
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
  const [state, formAction, pending] = useActionState<
    CreateProductState,
    FormData
  >(action, initialState);

  const {
    register,
    trigger,
    setError,
    clearErrors,
    reset,
    formState: { errors, touchedFields, isSubmitted, isValid },
  } = useForm({
    // <--- REMOVED <CreateProductFormInput>
    resolver: zodResolver(CreateProductFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      status: "draft", // No need for "as const" if inferring, but safe to keep
      name_en: "",
      name_ka: "",
      slug: "",
      price_cents: "", // Note: Ensure your schema accepts string for price if using inputs
      description_en: "",
      description_ka: "",
      category_ids: [],
      color_ids: [],
      size_ids: [],
    },
  });

  const [showBanner, setShowBanner] = React.useState(false);

  React.useEffect(() => {
    if (state.message) setShowBanner(true);
  }, [state.message]);

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
          className={[
            "my-6 rounded-md border px-3 py-2 text-sm",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700",
          ].join(" ")}
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
          className={[
            "inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2",
            pending || !isValid
              ? "bg-gray-300 text-gray-700 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-800",
          ].join(" ")}
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
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-semibold text-gray-900">
              General Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Status
              </label>
              <select
                {...register("status", {
                  onChange: () => clearErrors("status"),
                })}
                className={[
                  "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                  showErr("status")
                    ? "ring-red-300 focus:ring-red-500"
                    : "ring-gray-300 focus:ring-indigo-600",
                ].join(" ")}
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
                  className={[
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("price_cents")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600",
                  ].join(" ")}
                />
                {showErr("price_cents") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errMsg("price_cents")}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Slug
                </label>
                <input
                  type="text"
                  placeholder="my-new-product"
                  {...register("slug", { onChange: () => clearErrors("slug") })}
                  className={[
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("slug")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600",
                  ].join(" ")}
                />
                {showErr("slug") ? (
                  <p className="mt-1 text-xs text-red-600">{errMsg("slug")}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {...register("name_en", {
                    onChange: () => clearErrors("name_en"),
                  })}
                  className={[
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("name_en")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600",
                  ].join(" ")}
                />
                {showErr("name_en") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errMsg("name_en")}
                  </p>
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
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

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
                  {...register("name_ka", {
                    onChange: () => clearErrors("name_ka"),
                  })}
                  className={[
                    "mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset focus:ring-2",
                    showErr("name_ka")
                      ? "ring-red-300 focus:ring-red-500"
                      : "ring-gray-300 focus:ring-indigo-600",
                  ].join(" ")}
                />
                {showErr("name_ka") ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errMsg("name_ka")}
                  </p>
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
                  className="mt-2 block w-full rounded-md border-0 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Categories
            </h3>

            <div className="max-h-[280px] overflow-y-auto pr-2">
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
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <span className="ml-3 text-sm text-gray-800">{text}</span>
                  </label>
                );
              })}
            </div>

            {showErr("category_ids") ? (
              <p className="mt-2 text-xs text-red-600">
                {errMsg("category_ids")}
              </p>
            ) : null}
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Colors</h3>

            <div className="grid grid-cols-5 gap-3">
              {colors.map((c) => (
                <label key={c.id} className="cursor-pointer">
                  <input
                    type="checkbox"
                    value={c.id}
                    {...register("color_ids", {
                      onChange: () => clearErrors("color_ids"),
                    })}
                    className="sr-only peer"
                  />
                  <span
                    className={[
                      "block h-8 w-8 rounded-full border border-gray-200 shadow-sm transition-all",
                      "peer-checked:ring-2 peer-checked:ring-indigo-600 peer-checked:ring-offset-2",
                      showErr("color_ids") ? "ring-2 ring-red-300" : "",
                    ].join(" ")}
                    style={{ backgroundColor: c.hex || "#ccc" }}
                    title={c.code}
                  />
                </label>
              ))}
            </div>

            {showErr("color_ids") ? (
              <p className="mt-2 text-xs text-red-600">{errMsg("color_ids")}</p>
            ) : null}
          </div>

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
                    className="peer sr-only"
                  />
                  <span
                    className={[
                      "rounded-md border px-3 py-1.5 text-sm bg-white select-none transition-all",
                      showErr("size_ids")
                        ? "border-red-300"
                        : "border-gray-200",
                      "peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700",
                    ].join(" ")}
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
