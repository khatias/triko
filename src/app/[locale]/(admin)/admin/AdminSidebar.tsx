"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Layers, 

  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function AdminSidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: `/${locale}/admin`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Orders",
      href: `/${locale}/admin/orders`,
      icon: ShoppingBag,
      exact: false,
    },
    {
      name: "Products",
      href: `/${locale}/admin/products`,
      icon: Package,
      exact: false,
    },
    {
      name: "Groups",
      href: `/${locale}/admin/groups`,
      icon: Layers,
      exact: false,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm md:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center border-b border-zinc-100 px-6">
          <div className="flex items-center gap-2 font-bold text-zinc-900">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Package className="h-5 w-5" />
            </div>
            <span>Admin Panel</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <nav className="flex flex-col gap-1">
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Overview
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href, item.exact)
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive(item.href, item.exact) ? "text-zinc-900" : "text-zinc-400"}`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="border-t border-zinc-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3">
            <div className="h-9 w-9 rounded-full bg-zinc-200" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-zinc-900">
                Admin User
              </p>
              <p className="truncate text-xs text-zinc-500">
                admin@store.com
              </p>
            </div>
            <button className="text-zinc-400 hover:text-zinc-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}