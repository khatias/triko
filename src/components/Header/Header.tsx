import React from "react";
import { createClient } from "@/utils/supabase/server";
import Navbar from "./Navbar";
import { getCartState } from "@/lib/cart/actions";
import type { SafeUser } from "@/types/auth";
import { getVisibleGroups } from "@/lib/db/groups";
import Banner from "./Banner";
import { computeCartBadgeCount } from "@/lib/cart/count";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JwtClaims = {
  sub: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
};

function isJwtClaims(value: unknown): value is JwtClaims {
  if (!value || typeof value !== "object") return false;

  const v = value as Record<string, unknown>;
  if (typeof v.sub !== "string") return false;

  if ("email" in v && v.email !== undefined && typeof v.email !== "string")
    return false;

  if ("user_metadata" in v && v.user_metadata !== undefined) {
    if (!v.user_metadata || typeof v.user_metadata !== "object") return false;

    const um = v.user_metadata as Record<string, unknown>;
    if (
      "full_name" in um &&
      um.full_name !== undefined &&
      typeof um.full_name !== "string"
    ) {
      return false;
    }
  }

  return true;
}

export default async function Header({ locale }: { locale: "en" | "ka" }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  // getClaims failure should not break the whole header render
  if (error) console.warn("Header: getClaims error:", error);

  const rawClaims: unknown = data?.claims;

  const safeUser: SafeUser | null = isJwtClaims(rawClaims)
    ? {
        id: rawClaims.sub,
        email: rawClaims.email ?? "",
        full_name: rawClaims.user_metadata?.full_name ?? "",
      }
    : null;

  const groups = await getVisibleGroups();
  const state = await getCartState();
  const badgeCount = computeCartBadgeCount(state.items);

  return (
    <header className="sticky top-0 z-1000 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70 shadow-lg">
      <Banner locale={locale} />
      <Navbar
        user={safeUser}
        locale={locale}
        groups={groups ?? []}
        cartCount={badgeCount}
      />
    </header>
  );
}
