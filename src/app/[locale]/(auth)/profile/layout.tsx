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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = "Guest";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();
    fullName = profile?.full_name || "Guest";
  }

  return (
    <main className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-6 lg:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <SidebarNav fullName={fullName} />
        </aside>
        <section className="lg:col-span-9">{children}</section>
      </div>
    </main>
  );
}
