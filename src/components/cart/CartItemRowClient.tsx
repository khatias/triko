"use client";

import { useState, useTransition } from "react";
import type { CartItemRow, ActionResult } from "@/lib/cart/actions";
import { removeCartItem, updateCartQty } from "@/lib/cart/actions";
import { CartError } from "@/lib/cart/errors";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

type Props = {
  locale: "en" | "ka";
  item: CartItemRow;
};

export default function CartItemRowClient({ locale, item }: Props) {
  const [isPending, startTransition] = useTransition();
  const [qty, setQty] = useState<number>(item.qty);
  const [msg, setMsg] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setMsg(null);
    startTransition(() => {
      (async () => {
        const res = await fn();
        if (!res.ok) {
          setMsg(CartError(res));
          setQty(item.qty);
        } else {
          setMsg(null);
        }
      })();
    });
  }

  function onUpdate(newQty: number) {
    const next = Math.max(0, Math.floor(newQty));
    setQty(next);
    run(() => updateCartQty(locale, item.fina_id, next));
  }

  function onRemove() {
    run(() => removeCartItem(locale, item.fina_id));
  }

  return (
    <div className="mt-auto pt-2">
      <div className="flex items-center justify-between">
        {/* Sleek Quantity Pill (h-9) */}
        <div className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => onUpdate(qty - 1)}
            disabled={isPending || qty <= 0}
            className="flex h-full w-9 items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <div className="flex w-6 items-center justify-center text-sm font-semibold text-zinc-900">
            {qty}
          </div>

          <button
            type="button"
            onClick={() => onUpdate(qty + 1)}
            disabled={isPending}
            className="flex h-full w-9 items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Clean Delete Icon */}
        <button
          type="button"
          onClick={onRemove}
          disabled={isPending}
          className="group flex h-9 w-9 items-center justify-center text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50"
          title="Remove item"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {/* Error Toast */}
      {msg && (
        <div className="mt-1 text-[10px] font-medium text-red-600 text-right">
          {msg}
        </div>
      )}
    </div>
  );
}
