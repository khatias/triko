"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import type { CategoryRow } from "@/types/catalog";
import type { ProductCategoriesState } from "./categoryActions";
import { productCategoriesAction } from "./categoryActions";
import { labelForLocale } from "@/lib/helpers";
type AssignedCategory = {
  id: string;
  name_en: string | null;
  name_ka: string | null;
  position: number | null;
};

const initialState: ProductCategoriesState = { ok: false };



export default function EditProductCategories({
  locale,
  productId,
  assigned,
  allCategories,
}: {
  locale: string;
  productId: string;
  assigned: AssignedCategory[];
  allCategories: CategoryRow[];
}) {
  const action = productCategoriesAction.bind(null, locale, productId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const labelById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of allCategories) {
      m.set(c.id, labelForLocale(locale, c));
    }
    return m;
  }, [allCategories, locale]);

  const assignedById = React.useMemo(() => {
    const m = new Map<string, AssignedCategory>();
    for (const c of assigned) m.set(c.id, c);
    return m;
  }, [assigned]);

  // Local order state (needed for client-side reordering UI)
  const [order, setOrder] = React.useState<string[]>(
    () => assigned.map((c) => c.id)
  );

  // Only ONE useEffect: keep local order in sync when assigned changes (e.g., after server action)
  React.useEffect(() => {
    setOrder(assigned.map((c) => c.id));
  }, [assigned]);

  const available = React.useMemo(() => {
    const used = new Set(order);
    return allCategories.filter((c) => !used.has(c.id));
  }, [allCategories, order]);

  const [selectedId, setSelectedId] = React.useState("");

  // Derive selected category from "available" so we don't need a useEffect to clear invalid selections
  const selectedCategory = React.useMemo(() => {
    return available.find((c) => c.id === selectedId) ?? null;
  }, [available, selectedId]);

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = prev.slice();
      [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
      return copy;
    });
  }

  const canAdd = !pending && !!selectedCategory;

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <h3 className="text-sm font-semibold text-zinc-900">Categories</h3>
      </div>

      <div className="p-5 space-y-4">
        {state.message ? (
          <div
            className={`rounded-lg border p-3 flex items-start gap-2 text-sm ${
              state.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {state.ok ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5" />
            )}
            <div className="font-medium">{state.message}</div>
          </div>
        ) : null}

        <form action={formAction} className="flex gap-2 items-end">
          <input type="hidden" name="_intent" value="add" />

          <div className="flex-1">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 ml-1">
              Add category
            </label>

            <select
              name="category_id"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              value={selectedCategory?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={pending || available.length === 0}
            >
              <option value="" disabled>
                {available.length === 0
                  ? "No categories left to add"
                  : "Select a category"}
              </option>

              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {labelById.get(c.id) ?? "Untitled"}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!canAdd}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </form>

        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <div className="bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
            Current categories
          </div>

          {order.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              No categories assigned.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {order.map((id, idx) => {
                const c = assignedById.get(id);
                if (!c) return null;

                const label = labelById.get(id) ?? labelForLocale(locale, c);

                return (
                  <li
                    key={id}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-900 truncate">
                        {label}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {c.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => move(id, -1)}
                        disabled={idx === 0}
                        className="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => move(id, 1)}
                        disabled={idx === order.length - 1}
                        className="p-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <form action={formAction}>
                        <input type="hidden" name="_intent" value="remove" />
                        <input type="hidden" name="category_id" value={id} />
                        <button
                          type="submit"
                          disabled={pending}
                          className="p-2 rounded-md border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-60"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form action={formAction} className="flex justify-end">
          <input type="hidden" name="_intent" value="reorder" />
          <input type="hidden" name="order_json" value={JSON.stringify(order)} />
          <button
            type="submit"
            disabled={pending || order.length < 2}
            className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save order"}
          </button>
        </form>
      </div>
    </div>
  );
}
