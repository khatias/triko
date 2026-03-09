// src/utils/fina/ids.ts
import type { Variant } from "@/lib/db/products";
import { isObject } from "../type-guards";
type AnyRecord = Record<string, unknown>;


function asFinitePositiveInt(v: unknown): number | null {
  let n: number;
  if (typeof v === "number") {
    n = v;
  } else if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    n = Number(s);
  } else {
    return null;
  }

  if (!Number.isFinite(n)) return null;

  const i = Math.floor(n);
  if (i <= 0) return null;

  return i;
}

function pickPositiveIntField(obj: AnyRecord, key: string): number | null {
  return asFinitePositiveInt(obj[key]);
}

export function getFinaIdFromVariant(v: Variant): number | null {
  if (!isObject(v)) return null;
  return pickPositiveIntField(v, "fina_id");
}

export function requireFinaIdFromVariant(v: Variant): number {
  const id = getFinaIdFromVariant(v);
  if (id == null) throw new Error("Variant is missing fina_id");
  return id;
}

/**
 * Bundle variant carries:
 * top_fina_id
 * bottom_fina_id
 * from shop_catalog_parent_view variants json
 */
export function getBundleFinaIdsFromVariant(
  v: Variant,
): { top: number; bottom: number } | null {
  if (!isObject(v)) return null;

  const top = pickPositiveIntField(v, "top_fina_id");
  const bottom = pickPositiveIntField(v, "bottom_fina_id");

  if (top == null || bottom == null) return null;
  return { top, bottom };
}