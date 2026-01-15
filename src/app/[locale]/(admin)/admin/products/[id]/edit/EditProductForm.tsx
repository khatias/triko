"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { ProductRow } from "@/types/product";
import type { UpdateProductState } from "./actions";
import { updateProductAction } from "./actions";
import {
  Save,
  X,
  AlignLeft,
  Coins,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  Tag,
} from "lucide-react";

const initialState: UpdateProductState = { ok: false };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 text-red-600">
      <AlertCircle className="w-3.5 h-3.5" />
      <p className="text-xs font-medium">{msg}</p>
    </div>
  );
}

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1"
    >
      {children}
    </label>
  );
}

function Card({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

export default function EditProductForm({
  locale,
  product,
}: {
  locale: string;
  product: ProductRow;
}) {
  const router = useRouter();
  const action = updateProductAction.bind(null, locale, product.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  React.useEffect(() => {
    if (state.ok) {
      router.push(`/${locale}/admin/products/${product.id}`);
      router.refresh();
    }
  }, [state.ok, router, locale, product.id]);

  const fe = state.fieldErrors ?? {};
  const values = state.values;

  const getVal = (key: keyof NonNullable<UpdateProductState["values"]>, dbVal: unknown) => {
    const v = values?.[key];
    if (typeof v === "string") return v;
    if (typeof dbVal === "string") return dbVal;
    if (typeof dbVal === "number") return String(dbVal);
    return "";
  };

  return (
    <form action={formAction} className=" mx-auto pb-20">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Edit Product
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/admin/products/${product.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
            disabled={pending}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-70 transition-colors shadow-sm"
          >
            {pending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {pending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Global Message */}
      {state.message && (
        <div
          className={`mb-6 rounded-lg border p-4 flex items-start gap-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {state.ok ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <div className="pt-0.5 font-medium">{state.message}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Product Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name EN */}
              <div className="space-y-1">
                <Label htmlFor="name_en">Name (English)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1 rounded">
                      EN
                    </span>
                  </div>
                  <input
                    id="name_en"
                    name="name_en"
                    defaultValue={getVal("name_en", product.name_en)}
                    className="block w-full pl-11 rounded-lg border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5"
                    placeholder="E.g. Cotton T-Shirt"
                  />
                </div>
                <FieldError msg={fe.name_en?.[0]} />
              </div>

              {/* Name KA */}
              <div className="space-y-1">
                <Label htmlFor="name_ka">Name (Georgian)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1 rounded">
                      KA
                    </span>
                  </div>
                  <input
                    id="name_ka"
                    name="name_ka"
                    defaultValue={getVal("name_ka", product.name_ka)}
                    className="block w-full pl-11 rounded-lg border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5"
                    placeholder="მაგ. ბამბის მაისური"
                  />
                </div>
                <FieldError msg={fe.name_ka?.[0]} />
              </div>

              {/* Description EN */}
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="description_en">Description (English)</Label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="w-4 h-4 text-zinc-400" />
                  </div>
                  <textarea
                    id="description_en"
                    name="description_en"
                    defaultValue={getVal("description_en", product.description_en)}
                    rows={4}
                    className="block w-full pl-10 rounded-lg border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5"
                  />
                </div>
                <FieldError msg={fe.description_en?.[0]} />
              </div>

              {/* Description KA */}
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="description_ka">Description (Georgian)</Label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="w-4 h-4 text-zinc-400" />
                  </div>
                  <textarea
                    id="description_ka"
                    name="description_ka"
                    defaultValue={getVal("description_ka", product.description_ka)}
                    rows={4}
                    className="block w-full pl-10 rounded-lg border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5"
                  />
                </div>
                <FieldError msg={fe.description_ka?.[0]} />
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card title="Status & Visibility">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="status">Product Status</Label>
                <div className="relative">
                  <select
                    id="status"
                    name="status"
                    defaultValue={getVal("status", product.status ?? "draft")}
                    className="block w-full rounded-lg border-zinc-300 shadow-sm focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5 pl-3 pr-10 appearance-none bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Tag className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
                <FieldError msg={fe.status?.[0]} />
              </div>
            </div>
          </Card>

          <Card title="Pricing & URL">
            <div className="space-y-5">
              {/* Price (CENTS) ✅ */}
              <div className="space-y-1">
                <Label htmlFor="price_cents">Price (Tetri)</Label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Coins className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    name="price_cents"
                    id="price_cents"
                    inputMode="numeric"
                    step={1}
                    min={1}
                    defaultValue={getVal("price_cents", product.price_cents)}
                    className="block w-full rounded-lg border-zinc-300 pl-10 focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm py-2.5"
                    placeholder="1500"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-zinc-500 sm:text-xs">tetri</span>
                  </div>
                </div>
                <FieldError msg={fe.price_cents?.[0]} />
                <p className="text-[10px] text-zinc-400">
                  Example: Enter 1500 for 15.00 ₾
                </p>
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <LinkIcon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    name="slug"
                    id="slug"
                    defaultValue={getVal("slug", product.slug)}
                    className="block w-full rounded-lg border-zinc-300 pl-10 focus:border-zinc-500 focus:ring-zinc-500 sm:text-sm font-mono py-2.5 text-zinc-600 bg-zinc-50"
                  />
                </div>
                <FieldError msg={fe.slug?.[0]} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
