"use client";

import { usePathname } from "next/navigation";

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Works for /ka/admin/... and /en/admin/...
  const isAdmin = pathname.split("/").includes("admin");

  return isAdmin ? null : <>{children}</>;
}
