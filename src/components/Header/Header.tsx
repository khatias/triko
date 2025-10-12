import React from "react";
import { createClient } from "@/utils/supabase/server";
import Navbar from "./Navbar";
import { fetchNavCategories } from "@/lib/db/categories";
import type { SafeUser } from "@/types/auth";
import DesktopNavBar from "./BottomNavBar";

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

  const categories = await fetchNavCategories(locale);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70  shadow-lg">
      <Navbar user={safeUser} categories={categories ?? []} />
      <DesktopNavBar categories={categories ?? []} />
    </header>
  );
}
