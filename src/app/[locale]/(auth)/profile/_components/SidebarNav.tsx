"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslations } from "next-intl";

export default function SidebarNav() {
  const t = useTranslations("Profile");
  const links = [
    { href: "orders", label: t("sidebar.orders") },
    { href: "account", label: t("sidebar.account") },
    { href: "addresses", label: t("sidebar.addresses") },
  ];

  const pathname = usePathname();
  const base = pathname.split("/").slice(0, -1).join("/");
  const activeSeg = pathname.split("/").pop();

  return (
    <nav className="space-y-2 lg:space-y-4">
      {links.map((l) => {
        const active = activeSeg === l.href;
        return (
          <Link
            key={l.href}
            href={`${base}/${l.href}`}
            className={`block rounded-xl border px-4 py-3  transition ${
              active
                ? "border-orange-600 bg-orange-600 text-white hover:bg-orange-700"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
