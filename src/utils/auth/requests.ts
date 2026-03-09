import { CODES } from "./codes";

export type SignupPayload = {
  locale: string;
  email: string;
  password: string;
  full_name: string;
  website?: string;
};

export type AuthResult =
  | { ok: true; message?: string; email?: string; redirectTo?: string }
  | { ok: false; message?: string; code?: string };

type ApiResponse = {
  message?: string;
  email?: string;
  code?: string;
  redirectTo?: string;
};

async function readApi(res: Response): Promise<ApiResponse> {
  const data = (await res.json().catch(() => ({}))) as ApiResponse;
  return data && typeof data === "object" ? data : {};
}

export async function signupRequest(p: SignupPayload): Promise<AuthResult> {
  try {
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
      return { ok: false, message: data.message, code: data.code };
    }

    return { ok: true, message: data.message, email: data.email };
  } catch {
    return { ok: false, code: "UNEXPECTED_ERROR" };
  }
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

    const message = typeof data?.message === "string" ? data.message : undefined;
    const code = typeof data?.code === "string" ? data.code : undefined;
    const redirectTo =
      typeof data?.redirectTo === "string" ? data.redirectTo : undefined;

    if (!res.ok) {
      return { ok: false, message, code };
    }

    return {
      ok: true,
      message,
      email: typeof data?.email === "string" ? data.email : undefined,
      redirectTo,
    };
  } catch {
    return { ok: false, code: "UNEXPECTED_ERROR" };
  }
}

export type ForgotPasswordPayload = {
  locale: string;
  email: string;
  website?: string;
};

export async function forgotPasswordRequest(
  p: ForgotPasswordPayload,
): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-next-intl-locale": p.locale,
      },
      body: JSON.stringify({
        email: p.email,
        website: p.website ?? "",
      }),
      credentials: "include",
      cache: "no-store",
    });

    const data = await readApi(res);

    const message = typeof data?.message === "string" ? data.message : undefined;
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
    return { ok: false, code: CODES.UNEXPECTED_ERROR };
  }
}

export type ResetPasswordPayload = {
  locale: string;
  password: string;
  website?: string;
};

export async function resetPasswordRequest(
  p: ResetPasswordPayload,
): Promise<AuthResult> {
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-next-intl-locale": p.locale,
      },
      body: JSON.stringify({
        password: p.password,
        website: p.website ?? "",
      }),
      credentials: "include",
      cache: "no-store",
    });

    const data = await readApi(res);

    const message = typeof data?.message === "string" ? data.message : undefined;
    const code = typeof data?.code === "string" ? data.code : undefined;

    if (!res.ok) return { ok: false, message, code };

    return { ok: true, message };
  } catch {
    return { ok: false, code: CODES.UNEXPECTED_ERROR };
  }
}
