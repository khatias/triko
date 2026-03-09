"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { handleLogout } from "@/utils/auth/handleLogOut";
import LanguageSwitcher from "@/components/toggle/LanguageSwitcher";

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Admin");

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { key: "dashboard", href: `/admin`, icon: LayoutDashboard, exact: true },
    { key: "orders", href: `/admin/orders`, icon: ShoppingBag, exact: false },
    { key: "products", href: `/admin/products`, icon: Package, exact: false },
    { key: "groups", href: `/admin/groups`, icon: Layers, exact: false },
    { key: "site", href: `/admin/site`, icon: LayoutDashboard, exact: false },
    { key: "sets", href: `/admin/bundles/new`, icon: ShoppingBag, exact: false }
  ] as const;

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-zinc-300 bg-linear-to-r from-white to-zinc-50 p-2 shadow-md backdrop-blur-md transition hover:scale-105 active:scale-95 md:hidden"
        aria-label={isOpen ? t("actions.closeMenu") : t("actions.openMenu")}
        type="button"
      >
        {isOpen ? (
          <X className="h-5 w-5 text-zinc-700" />
        ) : (
          <Menu className="h-5 w-5 text-zinc-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-linear-to-b from-white to-zinc-50 shadow-lg transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 items-center border-b border-zinc-100 px-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 font-semibold text-zinc-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-zinc-900 to-zinc-700 text-white shadow-inner">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg">{t("sideBar.title")}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Language Toggle */}
          <div className="mb-5">
            <LanguageSwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 text-sm">
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t("sideBar.overview")}
            </div>
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-all duration-200 ${
                    active
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 transition-colors ${
                      active
                        ? "text-white"
                        : "text-zinc-400 group-hover:text-zinc-800"
                    }`}
                  />
                  {t(`items.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between rounded-xl bg-linear-to-r from-zinc-50 to-white p-3 shadow-inner">
            <span className="text-sm font-medium text-zinc-900">
              {t("sideBar.name")}
            </span>

            <form action={() => handleLogout()}>
              <button
                type="submit"
                className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 active:scale-95"
                aria-label={t("actions.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
