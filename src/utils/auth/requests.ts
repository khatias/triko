export type SignupPayload = {
  locale: string;
  email: string;
  password: string;
  full_name: string;
  website?: string;
};

export type AuthResult =
  | { ok: true; message?: string; email?: string }
  | { ok: false; message?: string; code?: string };

type ApiResponse = {
  message?: string;
  email?: string;
  code?: string;
};

async function readApi(res: Response): Promise<ApiResponse> {
  const data = (await res.json().catch(() => ({}))) as ApiResponse;
  return data && typeof data === "object" ? data : {};
}

export async function signupRequest(p: SignupPayload): Promise<AuthResult> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-next-intl-locale": p.locale,
    },
    body: JSON.stringify({
      email: p.email,
      password: p.password,
      full_name: p.full_name,
      website: p.website ?? "",
    }),
    credentials: "same-origin",
    cache: "no-store",
  });

  const data = await readApi(res);

  if (!res.ok) {
    return {
      ok: false,
      message:
        typeof data.message === "string" ? data.message : "Signup failed",
      code: typeof data.code === "string" ? data.code : undefined,
    };
  }

  return {
    ok: true,
    message: typeof data.message === "string" ? data.message : undefined,
    email: typeof data.email === "string" ? data.email : undefined,
  };
}

export async function loginRequest(
  locale: string,
  email: string,
  password: string,
  website?: string,
): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-next-intl-locale": locale,
      },
      body: JSON.stringify({ email, password, website: website ?? "" }),
      credentials: "include",
      cache: "no-store",
    });

    const data = await readApi(res);

    const message =
      typeof data?.message === "string" ? data.message : undefined;
    const code = typeof data?.code === "string" ? data.code : undefined;

    if (!res.ok) {
      return { ok: false, message, code };
    }

    return {
      ok: true,
      message,
      email: typeof data?.email === "string" ? data.email : undefined,
    };
  } catch {
    return { ok: false, code: "UNEXPECTED" };
  }
}
