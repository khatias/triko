"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslations } from "next-intl";
import { ShoppingBag, UserRound, MapPin, ChevronRight } from "lucide-react";

const getLinkClasses = (active: boolean) => {
  const base =
    "group flex items-center justify-between rounded-xl p-3 relative transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent)]";

  const state = active
    ? "text-[var(--color-ink)] font-semibold"
    : "text-slate-600 hover:bg-slate-100 hover:text-[var(--color-ink)]";

  return `${base} ${state}`;
};

export default function SidebarNav({ fullName }: { fullName: string }) {
  const t = useTranslations("Profile");
  const pathname = usePathname();

  const links = [
    { href: "/profile/orders", label: t("sidebar.orders"), icon: ShoppingBag },
    { href: "/profile/account", label: t("sidebar.account"), icon: UserRound },
    { href: "/profile/addresses", label: t("sidebar.addresses"), icon: MapPin },
  ];

  return (
    <div
      className="space-y-6 border border-slate-200 rounded-2xl rounded-t-xl p-6 bg-white w-full border-t-10"
      style={
        {
          "--color-accent": "#fdd5a2",
          "--color-ink": "#172a3e",
          borderColor: "#e2e8f0",
          borderTopColor: "var(--color-accent)",
        } as React.CSSProperties
      }
    >
      <div className="border-b border-slate-200 pb-6 mb-2 space-y-2">
        <p className="text-xl xl:text-2xl font-extrabold text-center text-[var(--color-ink)]">
          {fullName || "Guest"}
        </p>
        <p className="text-sm text-center text-slate-500 mt-1">
          {t("sidebar.title") || "My Profile"}
        </p>
      </div>

      <nav className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          // mark as active if pathname starts with href
          const active = pathname?.startsWith(href) ?? false;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={getLinkClasses(active)}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="grid h-6 w-6 place-items-center shrink-0">
                  <Icon className="h-5 w-5 text-current" />
                </span>
                <span className="truncate text-sm">{label}</span>
              </span>

              <ChevronRight
                className={[
                  "h-4 w-4 shrink-0 transition-all",
                  active
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
                ].join(" ")}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
