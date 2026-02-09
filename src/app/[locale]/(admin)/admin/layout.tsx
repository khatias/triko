import React from "react";
import { requireAdmin } from "@/utils/auth/requireAdmin";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);

  return <div className="min-h-screen">{children}</div>;
}
