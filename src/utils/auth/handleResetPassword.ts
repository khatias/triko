
import { supabase } from "../supabase/clients";
import { AuthResult } from "@/types/auth";

function mapSupabaseErrorToCode(status?: number, message?: string): string {
  const msg = (message ?? "").toLowerCase();

  if (status === 401 || msg.includes("jwt") || msg.includes("unauthorized")) {
    return "reset_link_invalid_or_expired";
  }
  if (status === 422 || msg.includes("weak") || msg.includes("at least")) {
    return "weak_password";
  }
  if (status === 429 || msg.includes("rate")) {
    return "rate_limited";
  }
  if (status && status >= 500) {
    return "server_error";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "network";
  }
  if (msg.includes("timeout")) {
    return "timeout";
  }
  if (msg.includes("uth session missing")) {
    return "reset_link_invalid_or_expired";
  }

  return "unknown";
}

export async function handleResetPassword(
  password: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      type SupabaseError = { status?: number; message: string };
      const supabaseError = error as SupabaseError;
      const code = mapSupabaseErrorToCode(
        supabaseError.status,
        supabaseError.message
      );
      return {
        ok: false,
        status: supabaseError.status ?? 400,
        code,
        message: supabaseError.message,
      };
    }

    if (!data?.user) {
      return {
        ok: false,
        status: 401,
        code: "RESET_LINK_INVALID_OR_EXPIRED",
        message: "No active session or recovery context.",
      };
    }

    return {
      ok: true,
      status: 200,
      code: "PASSWORD_UPDATED",
      message: "Password updated successfully.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("handleResetPassword error:", e);
    return {
      ok: false,
      status: 0,
      code: mapSupabaseErrorToCode(undefined, msg),
      message: msg,
    };
  }
}
