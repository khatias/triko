// src/components/Header/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";

import logo from "../../assets/Logo4.png";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import AccountMenu from "./AccountMenu";
import { wrap } from "../UI/primitives";
import { useTranslations } from "next-intl";
import type { SafeUser } from "@/types/auth";
import type { ShopGroup } from "@/lib/db/groups";
import { pickGroupName } from "@/lib/helpers";
import HeaderSearchToggle from "./HeaderSearch";
import SocialMedia from "../socialMedia/SocialMedia";
const CART_BADGE_MAX = 99;
const ROOT_PARENT_ID = 11;

function safeSlug(g: ShopGroup) {
  const s = String(g.slug_en ?? "").trim();
  return s.length ? s : null;
}

function formatBadgeCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return null;
  return n > CART_BADGE_MAX ? `${CART_BADGE_MAX}+` : String(n);
}

export default function Navbar({
  user,
  locale,
  groups,
  cartCount,
}: {
  user: SafeUser | null;
  locale: "en" | "ka";
  groups: ShopGroup[];
  cartCount: number;
}) {
  const t = useTranslations("Header");
  const pathname = usePathname();

  // desktop mega menu hover
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  // mobile drawer
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // mobile expand/collapse
  const [openParentId, setOpenParentId] = useState<number | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);

  // close on route change
  useEffect(() => {
    setMobileOpen(false);
    setActiveMenu(null);
    setOpenParentId(null);
  }, [pathname]);

  // body lock + focus management
  useEffect(() => {
    if (!isMobileOpen) return;

    previouslyFocusedElRef.current =
      document.activeElement as HTMLElement | null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => closeBtnRef.current?.focus());

    return () => {
      document.body.style.overflow = prevOverflow;
      previouslyFocusedElRef.current?.focus?.();
      previouslyFocusedElRef.current = null;
    };
  }, [isMobileOpen]);

  // ESC closes
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setActiveMenu(null);
        setOpenParentId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const safeCartCount = Number.isFinite(cartCount) ? Math.max(0, cartCount) : 0;

  const { topLevel, childrenByParentId } = useMemo(() => {
    const navigable = (groups ?? []).filter((g) => safeSlug(g) !== null);

    const top = navigable
      .filter((g) => g.parent_group_id === ROOT_PARENT_ID)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .slice(0, 3);

    const map = new Map<number, ShopGroup[]>();
    for (const g of navigable) {
      const pid = g.parent_group_id;
      if (typeof pid === "number") {
        const arr = map.get(pid) ?? [];
        arr.push(g);
        map.set(pid, arr);
      }
    }
    for (const [pid, arr] of map.entries()) {
      arr.sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
      map.set(pid, arr);
    }

    return { topLevel: top, childrenByParentId: map };
  }, [groups]);

  const isActivePath = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenParentId(null);
  };

  const toggleParent = (id: number) => {
    setOpenParentId((prev) => (prev === id ? null : id));
  };

  const mobileDrawer =
    mounted &&
    createPortal(
      <div
        className={[
          "fixed inset-0 lg:hidden z-9999",
          isMobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!isMobileOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close menu"
          className={[
            "absolute inset-0 w-full h-full",
            "bg-black/50 backdrop-blur-sm", // Smoother, darker blur
            "transition-opacity duration-300",
            isMobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={closeMobile}
          tabIndex={isMobileOpen ? 0 : -1}
        />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={[
            "absolute left-0 top-0 h-dvh w-[85%] max-w-95", // Slightly narrower for better proportions
            "bg-white shadow-2xl",
            "flex flex-col",
            "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]", // Snappier ease
            isMobileOpen ? "translate-x-0" : "-translate-x-full",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 shrink-0">
            <LanguageSwitcher />

            <button
              ref={closeBtnRef}
              type="button"
              onClick={closeMobile}
              className="p-2 -mr-2 text-neutral-400 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc6759] rounded-full"
              aria-label="Close menu"
              tabIndex={isMobileOpen ? 0 : -1}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 flex flex-col gap-8">
            {/* Search - Sleeker solid background */}
            <HeaderSearchToggle variant="mobile" />

            {/* Navigation List */}
            <nav className="flex flex-col gap-1">
              {/* Top-level "All Products" Link */}
              <Link
                href={`/${locale}/products`}
                onClick={closeMobile}
                className={[
                  "flex items-center py-3 text-xl font-bold tracking-tight transition-colors",
                  isActivePath(`/${locale}/products`)
                    ? "text-[#fc6759]"
                    : "text-neutral-900 hover:text-[#fc6759]",
                ].join(" ")}
              >
                {t("all")}
              </Link>

              <div className="h-px w-full bg-neutral-100 my-2" />

              {/* Parents & Children */}
              {topLevel.map((parent) => {
                const slug = safeSlug(parent);
                if (!slug) return null;

                const parentId = parent.group_id;
                const kids = childrenByParentId.get(parentId) ?? [];
                const hasKids = kids.length > 0;
                const open = openParentId === parentId;

                const parentHref = `/${locale}/${slug}`;
                const parentActive = isActivePath(parentHref);

                return (
                  <div key={parentId} className="flex flex-col">
                    {/* Parent Row */}
                    <div className="flex items-center justify-between">
                      <Link
                        href={parentHref}
                        onClick={closeMobile}
                        className={[
                          "flex-1 py-3 text-xl font-bold tracking-tight transition-colors",
                          parentActive
                            ? "text-[#fc6759]"
                            : "text-neutral-900 hover:text-[#fc6759]",
                        ].join(" ")}
                      >
                        {pickGroupName(parent, locale)}
                      </Link>

                      {hasKids && (
                        <button
                          type="button"
                          onClick={() => toggleParent(parentId)}
                          className="p-3 -mr-3 text-neutral-400 hover:text-neutral-900 transition-colors"
                          aria-expanded={open}
                          aria-controls={`mobile-children-${parentId}`}
                          tabIndex={isMobileOpen ? 0 : -1}
                        >
                          <ChevronDown
                            className={[
                              "h-5 w-5 transition-transform duration-300",
                              open ? "rotate-180" : "rotate-0",
                            ].join(" ")}
                          />
                        </button>
                      )}
                    </div>

                    {/* Children Accordion */}
                    {hasKids && (
                      <div
                        id={`mobile-children-${parentId}`}
                        className={[
                          "grid transition-all duration-300 ease-in-out",
                          open
                            ? "grid-rows-[1fr] opacity-100 mb-2"
                            : "grid-rows-[0fr] opacity-0",
                        ].join(" ")}
                      >
                        <div className="overflow-hidden">
                          {/* Indented vertical line to show grouping */}
                          <div className="flex flex-col gap-4 pl-5 border-l-2 border-neutral-100 mt-2 pb-3 ml-2">
                            {kids.map((child) => {
                              const cslug = safeSlug(child);
                              if (!cslug) return null;

                              const href = `/${locale}/${cslug}`;
                              const active = isActivePath(href);

                              return (
                                <Link
                                  key={child.group_id}
                                  href={href}
                                  onClick={closeMobile}
                                  className={[
                                    "text-base transition-colors",
                                    active
                                      ? "text-[#fc6759] font-semibold"
                                      : "text-neutral-500 hover:text-neutral-900",
                                  ].join(" ")}
                                >
                                  {pickGroupName(child, locale)}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
       <div className="pb-6">
              {" "}
              <SocialMedia />
            </div>

          {/* Footer App-like Bottom Bar */}
          <div className="bg-neutral-50 px-6 py-6 border-t border-neutral-100 flex flex-col gap-4 shrink-0">
     
            <Link
              href={`/${locale}/aboutUs`}
              onClick={closeMobile}
              className="text-sm font-semibold tracking-wide text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {t("aboutUs")}
            </Link>
            <Link
              href={`/${locale}/contact`}
              onClick={closeMobile}
              className="text-sm font-semibold tracking-wide text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {t("contact")}
            </Link>
          </div>
        </div>
      </div>,
      document.body,
    );

  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-100/80 transition-all duration-300"
      onMouseLeave={() => setActiveMenu(null)}
    >
      {/* ========= DESKTOP ========= */}
      <div
        className={`hidden lg:flex ${wrap} items-center justify-between h-20`}
      >
        <div className="flex-1 flex justify-start">
          <Link
            href={`/${locale}`}
            aria-label="Home"
            className="transition-opacity hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc6759] rounded-sm"
          >
            <Image
              src={logo}
              alt="Logo"
              width={200}
              height={100}
              className="h-30 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        <ul className="flex flex-1 justify-center gap-10 h-full items-center">
          {topLevel.map((parent) => {
            const slug = safeSlug(parent);
            if (!slug) return null;

            const kids = childrenByParentId.get(parent.group_id) ?? [];
            const hasKids = kids.length > 0;
            const href = `/${locale}/${slug}`;
            const isActive = isActivePath(href);

            return (
              <li
                key={parent.group_id}
                className="h-full flex items-center"
                onMouseEnter={() => hasKids && setActiveMenu(parent.group_id)}
              >
                <Link
                  href={href}
                  className={`relative group flex h-full items-center text-[13px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 ${
                    isActive ? "text-black" : "text-slate-700 hover:text-black"
                  }`}
                >
                  {pickGroupName(parent, locale)}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 w-full bg-[#fc6759] transition-transform duration-300 ease-out origin-left ${
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              </li>
            );
          })}

          <li className="h-full flex items-center">
            <Link
              href={`/${locale}/products`}
              className={`relative group flex h-full items-center text-[13px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 ${
                isActivePath(`/${locale}/products`)
                  ? "text-black"
                  : "text-slate-700 hover:text-black"
              }`}
            >
              {t("all")}
              <span
                className={`absolute bottom-0 left-0 h-0.5 w-full bg-[#fc6759] transition-transform duration-300 ease-out origin-left ${
                  isActivePath(`/${locale}/products`)
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              />
            </Link>
          </li>
        </ul>

        <div className="flex-1 flex justify-end items-center gap-6">
          <div className="pl-8">
            <HeaderSearchToggle variant="desktop" />
          </div>

          <AccountMenu user={user} />

          <Link
            href={`/${locale}/cart`}
            className="relative text-neutral-500 hover:text-neutral-900 transition-colors p-1"
            aria-label="Cart"
          >
            <ShoppingCartIcon className="h-6 w-6 stroke-2" />
            {safeCartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#fc6759] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {formatBadgeCount(safeCartCount)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* ========= DESKTOP MEGA MENU ========= */}
      <div
        className={`absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden border-t border-neutral-100 ${
          activeMenu
            ? "max-h-100 opacity-100"
            : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        <div className={`${wrap} py-10 flex justify-center gap-12 flex-wrap`}>
          {activeMenu &&
            (childrenByParentId.get(activeMenu) ?? []).map((child) => {
              const slug = safeSlug(child);
              if (!slug) return null;

              return (
                <Link
                  key={child.group_id}
                  href={`/${locale}/${slug}`}
                  onClick={() => setActiveMenu(null)}
                  className="group flex flex-col items-center justify-center rounded-xl px-6 py-4 transition-all hover:bg-neutral-50"
                >
                  <span className="text-sm font-semibold text-neutral-600 transition-colors group-hover:text-[#fc6759]">
                    {pickGroupName(child, locale)}
                  </span>
                  <div className="h-0.5 w-4 bg-neutral-200 mt-2 transition-all duration-300 group-hover:w-full group-hover:bg-[#fc6759] rounded-full" />
                </Link>
              );
            })}
        </div>
      </div>

      {/* ========= MOBILE TOP BAR ========= */}
      <div className="lg:hidden flex items-center justify-between h-16 px-5 bg-white">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 text-neutral-800 hover:bg-neutral-50 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc6759]"
          type="button"
          aria-label="Open menu"
        >
          <Bars3Icon className="h-7 w-7 stroke-[1.5]" />
        </button>

        <Link
          href={`/${locale}`}
          aria-label="Home"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <Image
            src={logo}
            alt="Logo"
            width={80}
            height={40}
            className="h-20 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          <AccountMenu user={user} />

          <Link
            href={`/${locale}/cart`}
            className="relative text-neutral-800 p-1"
            aria-label="Cart"
          >
            <ShoppingCartIcon className="h-6 w-6 stroke-[1.5]" />
            {safeCartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fc6759] px-1 text-[9px] font-bold text-white shadow-sm">
                {formatBadgeCount(safeCartCount)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* PORTAL */}
      {mobileDrawer}
    </nav>
  );
}
