"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import type { Variant } from "@/lib/db/products";
import { addToCart } from "@/lib/cart/actions";
import { getFinaIdFromVariant } from "@/utils/fina/ids";

type UseAddToCartOptions = {
  locale: string;
  qty?: number;
  successMessage?: string;
  toastMs?: number;
};

type UseAddToCartReturn = {
  onAdd: (variant: Variant) => void;
  isPending: boolean;
  pendingFinaId: number | null;
  err: string | null;
  toast: string | null;
  clearError: () => void;
  clearToast: () => void;
};

export function useAddToCart({
  locale,
  qty = 1,
  successMessage = "Added to cart",
  toastMs = 2200,
}: UseAddToCartOptions): UseAddToCartReturn {
  const [isPending, startTransition] = useTransition();
  const [pendingFinaId, setPendingFinaId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const clearError = useCallback(() => setErr(null), []);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toastMs);
    return () => clearTimeout(t);
  }, [toast, toastMs]);

  const onAdd = useCallback(
    (variant: Variant) => {
      const finaId = getFinaIdFromVariant(variant);
      if (finaId == null) {
        setErr("Variant is missing fina_id (check your view / Variant type).");
        return;
      }

      setErr(null);
      setPendingFinaId(finaId);

      startTransition(() => {
        (async () => {
          try {
            await addToCart(locale, finaId, qty);
            setToast(successMessage);
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Failed to add to cart";
            setErr(msg);
          } finally {
            setPendingFinaId(null);
          }
        })();
      });
    },
    [locale, qty, successMessage, startTransition],
  );

  return {
    onAdd,
    isPending,
    pendingFinaId,
    err,
    toast,
    clearError,
    clearToast,
  };
}
