import "server-only";
import type { BogTokenResponse } from "@/types/bog";
import { mustProcessEnv, mustAbsoluteUrl, isDev } from "@/utils/runtime";
import { isObject, readNumber, readString } from "@/utils/type-guards";

function basicAuthHeader(clientId: string, clientSecret: string): string {
  return (
    "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  );
}

type Cached = { token: string; expiresAtMs: number };
let cached: Cached | null = null;

export async function getBogAccessToken(): Promise<BogTokenResponse> {
  // Reuse cached token if still valid (10s safety window)
  const now = Date.now();
  if (cached && cached.expiresAtMs - 10_000 > now) {
    return {
      access_token: cached.token,
      token_type: "Bearer",
      expires_in: Math.floor((cached.expiresAtMs - now) / 1000),
    };
  }

  const tokenUrl = mustAbsoluteUrl(
    "BOG_TOKEN_URL",
    "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token",
  );

  const clientId = mustProcessEnv("BOG_CLIENT_ID");
  const clientSecret = mustProcessEnv("BOG_SECRET_KEY");

  // Timeout protection (avoid hanging requests)
  const controller = new AbortController();
  const timeoutMs = 10_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: basicAuthHeader(clientId, clientSecret),
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
      signal: controller.signal,
    });

    const text = await res.text();

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      throw new Error(
        `[BOG] Token request failed: HTTP ${res.status}. Body: ${text.slice(0, 300)}`,
      );
    }

    if (!isObject(parsed)) {
      throw new Error("[BOG] Token response is not a JSON object");
    }

    const access = readString(parsed, "access_token");
    if (!access) throw new Error("[BOG] Token response missing access_token");

    const tokenType = readString(parsed, "token_type") ?? "Bearer";
    const expiresIn = readNumber(parsed, "expires_in") ?? 300;

    cached = { token: access, expiresAtMs: Date.now() + expiresIn * 1000 };

    if (isDev()) console.log("[BOG] token ok, expires_in:", expiresIn);

    return {
      access_token: access,
      token_type: tokenType,
      expires_in: expiresIn,
    };
  } catch (e) {
    if (
      e instanceof Error &&
      (e.name === "AbortError" || e.message.toLowerCase().includes("aborted"))
    ) {
      throw new Error(`[BOG] Token request timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
