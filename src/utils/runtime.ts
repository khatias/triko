import "server-only";
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

function cleanBaseUrl(v: string): string {
  const trimmed = v.trim().replace(/\/+$/, "");
  const u = new URL(trimmed);
  return u.toString().replace(/\/$/, "");
}

export function getPublicSiteUrl(): string {
  const isProd = process.env.NODE_ENV === "production";

  const raw =
    process.env.PUBLIC_SITE_URL ??
    (!isProd ? process.env.NEXT_PUBLIC_BASE_URL : "") ??
    "";

  if (!raw.trim()) {
    throw new Error(
      "Missing env: PUBLIC_SITE_URL" +
        (isProd ? "" : " or NEXT_PUBLIC_BASE_URL"),
    );
  }

  const url = cleanBaseUrl(raw);

  if (isProd && !url.startsWith("https://")) {
    throw new Error("PUBLIC_SITE_URL must be HTTPS in production");
  }

  return url;
}

export function getCallbackUrl(publicSiteUrl: string): string {
  const raw = process.env.BOG_CALLBACK_URL?.trim();
  if (raw && raw.length > 0) return new URL(raw).toString();
  return new URL("/api/bog/callback", publicSiteUrl).toString();
}