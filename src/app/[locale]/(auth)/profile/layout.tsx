// app/[locale]/(auth)/profile/layout.tsx
import React from "react";
import SidebarNav from "../profile/_components/SidebarNav";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "Profile",
    path: "/profile",
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let fullName = "Guest";

  try {
    const supabase = await createClient();

    const userRes = await supabase.auth.getUser();
    const user = userRes.data?.user;

    if (user) {
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profileErr && profile?.full_name) fullName = profile.full_name;
    }
  } catch (e) {
    console.error("ProfileLayout: failed to load user/profile", e);
  }

  return (
    <main className="min-h-screen container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-6 lg:py-10 mb-40">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-3">
          <SidebarNav fullName={fullName} />
        </aside>
        <section className="lg:col-span-9">{children}</section>
      </div>
    </main>
  );
}
