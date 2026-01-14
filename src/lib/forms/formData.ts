// src/lib/forms/formData.ts
export type FdStringOptions = {
  trim?: boolean;
  maxLen?: number;
};

export function fdString(fd: FormData, key: string, opts: FdStringOptions = {}): string {
  const v = fd.get(key);
  if (typeof v !== "string") return "";

  const trim = opts.trim ?? true;
  const maxLen = opts.maxLen ?? 50_000;

  const s = trim ? v.trim() : v;
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

export function fdOptionalString(
  fd: FormData,
  key: string,
  opts: FdStringOptions = {}
): string | undefined {
  const s = fdString(fd, key, opts).trim();
  return s.length ? s : undefined;
}

export function fdIdsUnique(fd: FormData, key: string): string[] {
  const vals = fd.getAll(key);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const v of vals) {
    if (typeof v !== "string") continue;
    const s = v.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }

  return out;
}
