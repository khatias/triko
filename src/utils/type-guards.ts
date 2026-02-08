import { BogCurrency, BogLanguage } from "@/types/bog";

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}
export function asNullableString(v: unknown): string | null {
  if (v === null) return null;
  return isString(v) ? v : null;
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}
export function asInt(v: unknown, field: string): number {
  if (isNumber(v)) return Math.trunc(v);
  if (isString(v)) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  throw new Error(`Invalid int for ${field}`);
}
export function asNullableInt(v: unknown, field: string): number | null {
  if (v === null) return null;
  return asInt(v, field);
}
export function asMoneyString(v: unknown, field: string): string {
  if (isNumber(v)) return v.toFixed(2);
  if (isString(v)) {
    const n = Number(v.trim());
    if (Number.isFinite(n)) return n.toFixed(2);
    return v.trim();
  }
  throw new Error(`Invalid money for ${field}`);
}
export function asNullableMoneyString(
  v: unknown,
  field: string,
): string | null {
  if (v === null) return null;
  return asMoneyString(v, field);
}

export function isValidHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeLocale(v: string): "en" | "ka" {
  return v === "ka" ? "ka" : "en";
}

export function normalizeId(v: unknown): string | null {
  if (typeof v === "string" && v.trim().length) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}
export function readString(
  obj: Record<string, unknown>,
  key: string,
): string | null {
  const v = obj[key];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export function readNumber(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function localeToLang(locale?: string): BogLanguage {
  return locale === "en" ? "en" : "ka";
}
export function toNumber(v: string | number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function toTetri(v: string | number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromTetri(t: number): number {
  return t / 100;
}

export function sumBasketTetri(
  basket: { unit_price: number; quantity: number }[],
): number {
  return basket.reduce(
    (acc, it) => acc + Math.round(it.unit_price * 100) * it.quantity,
    0,
  );
}

export function asBogCurrency(v: unknown): BogCurrency {
  const s = typeof v === "string" ? v.toUpperCase() : "";
  if (s === "USD" || s === "EUR" || s === "GBP" || s === "GEL") return s;
  return "GEL";
}

export function readBoolean(
  obj: Record<string, unknown>,
  key: string,
): boolean | null {
  const v = obj[key];
  return typeof v === "boolean" ? v : null;
}

export function readNumberStrict(
  obj: Record<string, unknown>,
  key: string,
): number | null {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function hasImg(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}
