"use client";

import { useMemo, useState, useTransition } from "react";
import type { CartItemRow, ActionResult } from "@/lib/cart/actions";
import { removeCartItem, updateCartQty } from "@/lib/cart/actions";
import { CartError } from "@/lib/cart/errors";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Props = { locale: "en" | "ka"; item: CartItemRow };

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function CartItemRowClient({ locale, item }: Props) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const cartT = useTranslations("Cart");
  const p = useTranslations("Products");

  // IMPORTANT: qty should come from server item to avoid “UI drift”
  const qty = item.qty;

  const priceUI = useMemo(() => {
    const effStr = item.price_at_add; // "10.00"
    const listStr = item.list_price_at_add; // "25.00" | null

    const eff = toNum(effStr);
    const list = toNum(listStr);

    const hasDiscount =
      eff != null && list != null && list > eff;

    if (!hasDiscount) {
      return (
        <div className="font-bold text-zinc-900 tabular-nums text-lg">
          {effStr} ₾
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end sm:items-start">
        <div className="flex items-center gap-2">
          <div className="font-bold text-zinc-900 tabular-nums text-lg">
            {effStr} ₾
          </div>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {p("sale")}
          </span>
        </div>
        <div className="text-xs font-medium text-zinc-400 line-through tabular-nums">
          {listStr} ₾
        </div>
      </div>
    );
  }, [item.price_at_add, item.list_price_at_add, p]);

  function run(fn: () => Promise<ActionResult>) {
    setMsg(null);

    startTransition(() => {
      (async () => {
        const res = await fn();
        if (!res.ok) {
          setMsg(CartError(res, cartT));
          return;
        }
        router.refresh();
      })().catch(() => setMsg(cartT("errors.generic")));
    });
  }

  function onUpdate(nextQty: number) {
    const next = Math.max(0, Math.floor(nextQty));
    run(() => updateCartQty(locale, item.fina_id, next));
  }

  function onRemove() {
    run(() => removeCartItem(locale, item.fina_id));
  }

  return (
    <div className="mt-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
        
        {/* Left: Quantity Controls */}
        <div className="flex h-10 items-center rounded-lg border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-900/5">
          <button
            type="button"
            onClick={() => onUpdate(qty - 1)}
            disabled={isPending || qty <= 0}
            className="flex h-full w-10 items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="flex w-8 items-center justify-center text-sm font-semibold text-zinc-900 tabular-nums border-x border-zinc-100 h-full">
            {qty}
          </div>

          <button
            type="button"
            onClick={() => onUpdate(qty + 1)}
            disabled={isPending}
            className="flex h-full w-10 items-center justify-center text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Price & Delete */}
        <div className="flex items-center gap-6 ml-auto sm:ml-0">
          {/* Price */}
          {priceUI}

          {/* Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="group flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Remove item"
            aria-label="Remove item"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5 transition-transform group-hover:scale-110" />
            )}
          </button>
        </div>
      </div>

      {msg ? (
        <div className="mt-2 text-[11px] font-medium text-red-600 text-right animate-pulse">
          {msg}
        </div>
      ) : null}
    </div>
  );
}