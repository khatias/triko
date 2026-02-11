import React from "react";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Protect the route
  await requireAdmin(locale);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* This Sidebar must have 'fixed' class inside it 
        for the margin-left below to work.
      */}
      <AdminSidebar />

      {/* md:ml-64 pushes the content to the right 
        to make space for the fixed sidebar 
      */}
      <div className="transition-all duration-300 md:ml-64">
        <main className="min-h-screen p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
