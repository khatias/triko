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
export function asNullableMoneyString(v: unknown, field: string): string | null {
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
