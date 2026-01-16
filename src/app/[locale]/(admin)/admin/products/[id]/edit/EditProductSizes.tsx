// src/app/[locale]/(admin)/admin/products/[id]/edit/EditProductSizes.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import type { SizeRow } from "@/types/catalog";
import {
  productSizesAction,
  type ProductSizesState,
} from "./productSizesAction";
import { cx } from "@/lib/helpers";

const initialState: ProductSizesState = { ok: false };

function SubmitButton({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold",
        pending || disabled
          ? "bg-zinc-200 text-zinc-600 cursor-not-allowed"
          : "bg-zinc-900 text-white hover:bg-zinc-800"
      )}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

export default function EditProductSizes({
  locale,
  productId,
  assignedSizeIds,
  allSizes,
}: {
  locale: string;
  productId: string;
  assignedSizeIds: string[];
  allSizes: SizeRow[];
}) {
  const router = useRouter();
  const action = productSizesAction.bind(null, locale, productId);
  const [state, formAction] = useActionState(action, initialState);


  const [selected, setSelected] = React.useState<string[]>(assignedSizeIds);

  const assignedKey = React.useMemo(() => {
    return [...(assignedSizeIds ?? [])].sort().join("|");
  }, [assignedSizeIds]);

  React.useEffect(() => {
    setSelected([...(assignedSizeIds ?? [])]);
  }, [assignedKey, assignedSizeIds]);

  React.useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const selectedSet = React.useMemo(() => new Set(selected), [selected]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Sizes</h3>
        <p className="text-xs text-zinc-500 mt-1">
          This updates product variants. Missing combos will be created.
        </p>
      </div>

      {state.message ? (
        <div
          className={cx(
            "rounded-lg border px-3 py-2 text-xs",
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {state.message}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="_intent" value="sizes_save" />

        {selected.map((id) => (
          <input key={id} type="hidden" name="size_ids" value={id} />
        ))}

        <div className="flex flex-wrap gap-2">
          {allSizes.map((s) => {
            const on = selectedSet.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelected((prev) => {
                    const set = new Set(prev);
                    if (set.has(s.id)) set.delete(s.id);
                    else set.add(s.id);
                    return Array.from(set);
                  });
                }}
                className={cx(
                  "rounded-md border px-3 py-1.5 text-sm select-none transition-all",
                  on
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                )}
              >
                {s.code}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Selected: <span className="font-semibold">{selected.length}</span>
          </div>
          <SubmitButton disabled={selected.length === 0}>
            Save sizes
          </SubmitButton>
        </div>

        {selected.length === 0 ? (
          <div className="text-xs text-red-600">Select at least 1 size.</div>
        ) : null}
      </form>
    </div>
  );
}
