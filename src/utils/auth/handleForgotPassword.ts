import type { AuthResult } from "@/types/auth";
import { sanitizeEmail } from "../../lib/validation/auth";
import { timeoutSignal, safeJson } from "../http";
const TIMEOUT_MS = 10000;

function isNonEmptyString(email: string): boolean {
  return typeof email === "string" && email.trim().length > 0;
}

export async function handleForgotPasswordSubmit(
  e: React.FormEvent<HTMLFormElement>,
  locale: string
): Promise<AuthResult> {
  e.preventDefault();

  const fd = new FormData(e.currentTarget);
  const email = sanitizeEmail(fd.get("email"));
  const website = String(fd.get("website") ?? ""); // honeypot

  if (website) {
    return {
      ok: true,
      status: 200,
      code: "OK",
      message: "If the email exists, a reset link will be sent.",
    };
  }

  if (!isNonEmptyString(email)) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION",
      message: "Email is required.",
    };
  }

  try {
    const res = await fetch("/api/forgot", {
      method: "POST",
      headers: {
        "x-next-intl-locale": locale,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
      },
      body: new URLSearchParams({ email, ...(website ? { website } : {}) }),
      credentials: "same-origin",
      cache: "no-store",
      signal: timeoutSignal(TIMEOUT_MS),
    });

    const data = await safeJson(res);

    return {
      ok: res.ok,
      status: res.status,
      code: typeof data.code === "string" ? data.code : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
      email: typeof data.email === "string" ? data.email : undefined,
    };
  } catch (err) {
    const aborted = (err as { name?: string })?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      code: aborted ? "TIMEOUT" : "NETWORK",
      message: aborted
        ? "Request timed out. Please try again."
        : "Network error. Please try again.",
    };
  }
}
