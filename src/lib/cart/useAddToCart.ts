"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import type { Variant } from "@/lib/db/products";
import { addToCart, addBundleToCart } from "@/lib/cart/actions";
import {
  getFinaIdFromVariant,
  getBundleFinaIdsFromVariant,
} from "@/utils/fina/ids";

type BundleMeta = {
  parentCode: string | null;
  titleEn: string | null;
  titleKa: string | null;
  imageUrl: string | null;
};

type UseAddToCartOptions = {
  locale: string;
  qty?: number;
  successMessage?: string;
  toastMs?: number;
};

type UseAddToCartReturn = {
  onAdd: (variant: Variant) => void;
  onAddBundle: (variant: Variant, meta: BundleMeta) => void; // ✅ NEW
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
            const res = await addToCart(locale, finaId, qty);

            if (!res.ok) {
              setErr(res.message);
              return;
            }

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
    [locale, qty, successMessage],
  );

  // ✅ NEW: bundle add uses SAME toast + SAME err
  const onAddBundle = useCallback(
    (variant: Variant, meta: BundleMeta) => {
      const ids = getBundleFinaIdsFromVariant(variant);
      if (!ids) {
        setErr("Bundle variant is missing top/bottom fina ids.");
        return;
      }

      setErr(null);

      // pick one id so ProductCard can show "…" on a button
      setPendingFinaId(ids.top);

      startTransition(() => {
        (async () => {
          try {
            const res = await addBundleToCart(
              locale,
              ids.top,
              ids.bottom,
              qty,
              meta,
            );

            if (!res.ok) {
              setErr(res.message);
              return;
            }

            setToast(successMessage);
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Failed to add bundle to cart";
            setErr(msg);
          } finally {
            setPendingFinaId(null);
          }
        })();
      });
    },
    [locale, qty, successMessage],
  );

  return {
    onAdd,
    onAddBundle,
    isPending,
    pendingFinaId,
    err,
    toast,
    clearError,
    clearToast,
  };
}