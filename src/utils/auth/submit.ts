import type { AuthAction, AuthResult } from "@/types/auth";
import { sanitizeEmail, isNonEmptyString } from "../../lib/validation/auth";
import { TIMEOUT_MS, timeoutSignal, safeJson } from "@/utils/http";

function setIfNonEmpty(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
}

export async function handleAuthSubmit(
  e: React.FormEvent<HTMLFormElement>,
  action: AuthAction,
  locale: string
): Promise<AuthResult> {
  e.preventDefault();

  const fd = new FormData(e.currentTarget);
  const email = sanitizeEmail(fd.get("email"));
  const password = String(fd.get("password") ?? "");
  const website = String(fd.get("website") ?? "");
  const full_name = String(fd.get("full_name") ?? "");

  const isSignup = action === "signup";

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION",
      message: "Email and password are required.",
    };
  }
  if (isSignup && (password.length < 8 || password.length > 72)) {
    return {
      ok: false,
      status: 400,
      code: "WEAK_PASSWORD",
      message: "Password must be 8–72 characters.",
    };
  }

  const body = new URLSearchParams();
  body.set("email", email);
  body.set("password", password);
  body.set("action", action);
  setIfNonEmpty(body, "website", website); // omit empty honeypot
  if (isSignup) {
    setIfNonEmpty(body, "full_name", full_name.trim());
  }
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "x-next-intl-locale": locale,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
      },
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal: timeoutSignal(TIMEOUT_MS),
    });

    const data = await safeJson(res);
    if (res.ok && data.code === "SIGNIN_OK") {
      window.location.assign(`/${locale}/profile`);
    }
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

// Convenience wrappers
export const handleLoginSubmit = (
  e: React.FormEvent<HTMLFormElement>,
  locale: string
) => handleAuthSubmit(e, "login", locale);

export const handleSignupSubmit = (
  e: React.FormEvent<HTMLFormElement>,
  locale: string
) => handleAuthSubmit(e, "signup", locale);
