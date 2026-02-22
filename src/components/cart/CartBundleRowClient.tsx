// src/components/cart/CartBundleRowClient.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import type { CartItemRow, ActionResult } from "@/lib/cart/actions";
import { updateCartQty } from "@/lib/cart/actions";
import { CartError } from "@/lib/cart/errors";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type Props = { locale: "en" | "ka"; items: CartItemRow[] };

function toNum(v: string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatMoney(n: number): string {
  return n.toFixed(2);
}

export default function CartBundleRowClient({ locale, items }: Props) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  const cartT = useTranslations("Cart");

  const qty = items[0]?.qty ?? 1;

  const bundleUnitTotal = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      sum += toNum(it.price_at_add) ?? 0;
    }
    return sum;
  }, [items]);

  const totalUI = useMemo(() => {
    const total = bundleUnitTotal * qty;
    return (
      <div className="font-bold text-zinc-900 tabular-nums text-lg">
        {formatMoney(total)} ₾
      </div>
    );
  }, [bundleUnitTotal, qty]);

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

    run(async () => {
      const results = await Promise.all(
        items.map((it) => updateCartQty(locale, it.fina_id, next)),
      );
      const bad = results.find((r) => !r.ok);
      return bad ?? { ok: true };
    });
  }

  function onRemove() {
    onUpdate(0);
  }

  return (
    <div className="mt-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
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

        <div className="flex items-center gap-6 ml-auto sm:ml-0">
          {totalUI}

          <button
            type="button"
            onClick={onRemove}
            disabled={isPending}
            className="group flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title={locale === "ka" ? "წაშლა" : "Remove"}
            aria-label={locale === "ka" ? "წაშლა" : "Remove"}
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