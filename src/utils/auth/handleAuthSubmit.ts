// utils/auth/handleAuthSubmit.ts

export type AuthResult = {
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
  email?: string;
};

type AuthAction = "signup" | "login";
const TIMEOUT_MS = 10_000 as const;

const sanitizeEmail = (v: unknown) =>
  String(v ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0;

function timeoutSignal(ms: number): AbortSignal {
  if ("timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

async function safeJson(res: Response): Promise<Record<string, unknown>> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("application/json")) return {};
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function handleAuthSubmit(
  e: React.FormEvent<HTMLFormElement>,
  action: AuthAction,
  locale: string
): Promise<AuthResult> {
  e.preventDefault();

  const form = e.currentTarget;
  const fd = new FormData(form);

  const email = sanitizeEmail(fd.get("email"));
  const password = String(fd.get("password") ?? "");
  const website = String(fd.get("website") ?? ""); // honeypot

  const isSignup = action === "signup";

  // Minimal client-side validation (server stays authoritative)
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return {
      ok: false,
      status: 400,
      code: "VALIDATION",
      message: "Email and password are required.",
    };
  }
  // Enforce strength only on signup; let server decide for login
  if (isSignup && (password.length < 8 || password.length > 72)) {
    return {
      ok: false,
      status: 400,
      code: "WEAK_PASSWORD",
      message: "Password must be 8–72 characters.",
    };
  }

  // Build body
  const body = new URLSearchParams();
  body.set("email", email);
  body.set("password", password);
  body.set("action", action);
  if (website) body.set("website", website); // keep empty honeypot out

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
