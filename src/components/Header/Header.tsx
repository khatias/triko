// src/components/Header/Header.tsx

import React from "react";
import { createClient } from "@/utils/supabase/server";
import Navbar from "./Navbar";

import type { SafeUser } from "@/types/auth";
import DesktopNavBar from "./BottomNavBar";

// adjust this import to your real file path
import { getVisibleGroups } from "@/lib/db/groups";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Header({ locale }: { locale: "en" | "ka" }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const safeUser: SafeUser | undefined = user && {
    id: user.id,
    email: user.email ?? "",
    full_name: String(user.user_metadata?.full_name ?? ""),
  };

  // new groups for the desktop bottom bar
  const groups = await getVisibleGroups();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-lg">
      <Navbar user={safeUser} locale={locale} groups={groups ?? []} />

      <DesktopNavBar
        locale={locale}
        groups={groups ?? []}
        maxVisible={6}
        basePath="/groups"
      />
    </header>
  );
}
