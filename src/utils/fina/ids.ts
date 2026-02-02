import type { Variant } from "@/lib/db/products";

export function getFinaIdFromVariant(v: Variant): number | null {
  if (typeof v !== "object" || v === null) return null;

  const fina = (v as Record<string, unknown>).fina_id;

  if (typeof fina === "number" && Number.isFinite(fina)) return fina;

  if (typeof fina === "string" && fina.trim() !== "") {
    const n = Number(fina);
    if (Number.isFinite(n)) return n;
  }

  return null;
}

export function requireFinaIdFromVariant(v: Variant): number {
  const id = getFinaIdFromVariant(v);
  if (id == null) throw new Error("Variant is missing fina_id");
  return id;
}
