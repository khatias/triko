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

export default async function Header({ locale }: { locale: "en" | "ka" }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeUser: SafeUser | null = user
    ? {
        id: user.id,
        email: user.email ?? "",
        full_name: String(user.user_metadata?.full_name ?? ""),
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
