"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingBag,
  UserRound,
  MapPin,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { handleLogout } from "@/utils/auth/handleLogOut";
interface SidebarNavProps {
  fullName: string;
}

export default function SidebarNav({ fullName }: SidebarNavProps) {
  const t = useTranslations("Profile");
  const pathname = usePathname();

  const links = [
    { href: "/profile/orders", label: t("sidebar.orders"), icon: ShoppingBag },
    { href: "/profile/account", label: t("sidebar.account"), icon: UserRound },
    { href: "/profile/addresses", label: t("sidebar.addresses"), icon: MapPin },
  ];

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ME";

  return (
    <div className="flex flex-col h-full max-h-125 w-full bg-white border border-slate-200 rounded-2xl">
      <div className="flex flex-col items-center justify-center p-8 border-b border-slate-100">
        <div className="h-16 w-16 mb-4 rounded-full bg-[#ffde85] text-black flex items-center justify-center text-xl font-medium">
          {initials}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900">
            {fullName || "Guest User"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("sidebar.title") || "Member Settings"}
          </p>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname?.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between px-4 py-3 rounded-md transition-colors duration-200 ${
                isActive
                  ? "bg-slate-50 text-[#172a3e] font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? "text-[#172a3e]"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="text-sm">{label}</span>
              </div>

              <ChevronRight
                className={`h-4 w-4 transition-transform duration-200 ${
                  isActive
                    ? "text-[#172a3e] opacity-100"
                    : "text-slate-400 opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>{t("sidebar.signOut")}</span>
        </button>
      </div>
    </div>
  );
}
