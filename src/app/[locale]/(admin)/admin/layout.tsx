import React from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { AdminSidebar } from "./AdminSidebar";
import { routing } from "@/i18n/routing";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Locale = "ka" | "en";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
}) {
  const { locale } = await Promise.resolve(params);

  if (!routing.locales.includes(locale as Locale)) notFound();

  await requireAdmin(locale);

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar />

      <div className="transition-all duration-300 md:ml-64">
        <main className="min-h-screen p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
