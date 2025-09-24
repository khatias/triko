export const dynamic = "force-dynamic";
export const revalidate = 0;

import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProfileShell from "./ProfileShell";

// ======================= PAGE (SERVER) =======================
type Tab = "orders" | "account";

export default async function ProfilePage({
  searchParams,
}: {
  // In Next 14.2+/15, searchParams is a Promise in RSC
  searchParams?: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Await the promise before using it
  const sp = (await searchParams) ?? {};
  const candidate = sp.tab;
  const initialTab: Tab = candidate === "orders" || candidate === "account" ? candidate : "orders";

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">My Profile</h1>
      <ProfileShell initialTab={initialTab} profile={profile} />
    </div>
  );
}
