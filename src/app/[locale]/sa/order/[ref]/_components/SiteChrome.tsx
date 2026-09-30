"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Hides the site header, banner and footer on the customer order page. */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (/\/sa\/order(\/|$)/.test(pathname)) return null;
  return <>{children}</>;
}