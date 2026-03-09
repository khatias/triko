import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type AdminRole = "admin" | "owner" | "staff";

type JwtClaims = {
  sub: string;
};

function isJwtClaims(value: unknown): value is JwtClaims {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.sub === "string";
}

export async function requireAdmin(
  locale: string,
  allowed: AdminRole[] = ["admin", "owner"],
) {
  const supabase = await createClient();

  // ✅ use claims instead of getUser
  const { data, error: claimsErr } = await supabase.auth.getClaims();
  const rawClaims: unknown = data?.claims;

  if (claimsErr || !isJwtClaims(rawClaims)) redirect(`/${locale}/login`);

  const userId = rawClaims.sub;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  const role = profile?.role as AdminRole | undefined;
  if (profileErr || !role || !allowed.includes(role)) redirect(`/${locale}`);

  // keep return shape compatible (user is now minimal)
  return {
    supabase,
    user: { id: userId },
    role,
  };
}