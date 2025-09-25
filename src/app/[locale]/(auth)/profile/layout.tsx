// app/[locale]/(auth)/profile/layout.tsx
import React from "react";
import SidebarNav from "../profile/_components/SidebarNav";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";

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

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 min-h-[50vh]">
        <aside className="lg:col-span-3">
          <SidebarNav />
        </aside>
        <section className="lg:col-span-9">{children}</section>
      </div>
    </main>
  );
}
