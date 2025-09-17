export type AuthResult = {
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
  email?: string;
};

export async function handleAuthSubmit(
  e: React.FormEvent<HTMLFormElement>,
  action: "signup" | "login",
  locale: string
): Promise<AuthResult> {
  e.preventDefault();

  const form = e.currentTarget;
  const formData = new FormData(form);

  const email = String(formData.get("email") ?? "").normalize("NFKC").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const website = String(formData.get("website") ?? ""); // honeypot

  if (!email || !password) {
    return { ok: false, status: 400, code: "VALIDATION", message: "Email and password are required." };
  }
  if (password.length < 8 || password.length > 72) {
    return { ok: false, status: 400, code: "WEAK_PASSWORD", message: "Password must be 8–72 characters." };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);

  try {
    const body = new URLSearchParams({ email, password, action, website });

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "x-next-intl-locale": locale,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Accept": "application/json",
      },
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal: ctrl.signal,
    });

    const data = (await res.json().catch(() => ({}))) as Partial<AuthResult>;
    return { ok: res.ok, status: res.status, ...data };
  } catch (err: unknown) {
    const aborted = typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === "AbortError";
    return {
      ok: false,
      status: 0,
      code: aborted ? "TIMEOUT" : "NETWORK",
      message: aborted ? "Request timed out. Please try again." : "Network error. Please try again.",
    };
  } finally {
    clearTimeout(timer);
  }
}
