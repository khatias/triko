export const TIMEOUT_MS = 10_000 as const;

export function timeoutSignal(ms: number): AbortSignal {
  if ("timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

export async function safeJson(
  res: Response
): Promise<Record<string, unknown>> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) return {};
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
