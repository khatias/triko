export function mustProcessEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`[runtime] Missing env: ${name}`);
  return v;
}

export function mustAbsoluteUrl(name: string, fallback: string): string {
  const raw = (process.env[name] ?? fallback).trim();
  try {
    return new URL(raw).toString();
  } catch {
    throw new Error(`[runtime] Invalid URL in ${name}: ${raw}`);
  }
}

export function isDev(): boolean {
  return process.env.NODE_ENV !== "production";
}

