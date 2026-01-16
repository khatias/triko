type Rec = Record<string, unknown>;

// Narrow unknown value into a plain object so we can safely read fields like r["id"].
// Returns null if the value is not an object (or is null).
export function asRec(v: unknown): Rec | null {
  return v && typeof v === "object" ? (v as Rec) : null;
}
// Safely read a string field from FormData. If the value is not a string, return an empty string.
export function fdString(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

// Safely read a string field from a Record. If the value is not a string, return null.
export function readString(r: Rec, key: string): string | null {
  const v = r[key];
  return typeof v === "string" ? v : null;
}

// Safely read a finite number field from a Record. Returns null if missing, not a number, or NaN/Infinity.
export function readNumber(r: Rec, key: string): number | null {
  const v = r[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Parse a label like "— — Category Name" into depth and text.
export function parseIndentedLabel(raw: string): { depth: number; text: string } {
  let depth = 0;
  let s = raw;
  while (s.startsWith("— ")) {
    depth += 1;
    s = s.slice(2);
  }
  return { depth, text: s.trimStart() };
}

export function moneyFromCents(cents: number | null): string {
  if (typeof cents !== "number") return "N/A";
  const v = cents / 100;
  return v.toLocaleString("ka-GE", { style: "currency", currency: "GEL" });
}

