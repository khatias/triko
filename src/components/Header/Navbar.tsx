"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { Search, Info, Mail } from "lucide-react";

import logo from "../../assets/logo.png";
import newarrivals from "../../assets/new-arrivals.jpg";
import pajama from "../../assets/pajama.jpg";

import FeaturedCircles from "../cards/FeatureCircle";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import SocialMedia from "../socialMedia/SocialMedia";
import AccountMenu from "./AccountMenu";
import { wrap } from "../UI/primitives";

import { useTranslations } from "next-intl";
import type { SafeUser } from "@/types/auth";
import type { ShopGroup } from "@/lib/db/groups";

const CART_BADGE_MAX = 99;

function groupLabel(locale: "en" | "ka", g: ShopGroup) {
  const ka = String(g.name_ka ?? "").trim();
  const en = String(g.name_en ?? "").trim();
  const fallback = String(g.fina_name ?? "").trim();
  return locale === "ka" ? ka || en || fallback : en || ka || fallback;
}

function groupHref(locale: "en" | "ka", g: ShopGroup) {
  const slug = String(g.slug_en ?? "").trim();
  return `/${locale}/${slug}`;
}

function formatBadgeCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > CART_BADGE_MAX) return `${CART_BADGE_MAX}+`;
  return String(n);
}

function CartIconWithBadge({
  href,
  count,
  onClick,
}: {
  href: string;
  count: number;
  onClick?: () => void;
}) {
  const badge = formatBadgeCount(count);

  return (
    <Link
      href={href}
      aria-label="Cart"
      onClick={onClick}
      className="relative inline-flex"
    >
      <ShoppingCartIcon className="h-6 w-6 text-slate-800 cursor-pointer" />
      {badge ? (
        <span className="absolute -right-2 -top-2 min-w-4.5 h-4.5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-4.5 text-center shadow-sm">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function Navbar({
  user,
  locale,
  groups,
  cartCount,
}: {
  user: SafeUser;
  locale: "en" | "ka";
  groups: ShopGroup[];
  cartCount: number;
}) {
  const t = useTranslations("Header");
  const [isOpen, setOpen] = useState(false);

  const safeCartCount = Number.isFinite(cartCount) ? Math.max(0, cartCount) : 0;

  const visibleGroups = (groups ?? []).filter((g) => {
    const slug = String(g.slug_en ?? "").trim();
    return slug.length > 0;
  });

  return (
    <nav className=" border-b border-slate-200/70 bg-white/80 backdrop-blur supports-backdrop-filter:bg-white">
      {/* DESKTOP */}
      <div className={`hidden lg:block ${wrap}`}>
        <div className="grid grid-cols-[auto_1fr_auto] items-center py-3">
          <Link
            href={`/${locale}`}
            aria-label="Home"
            className="justify-self-center"
          >
            <Image
              src={logo}
              alt="Logo"
              width={80}
              height={40}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-4 justify-self-end">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                className="h-11 w-md rounded-xl border border-slate-200/60 bg-white/70 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 shadow-inner transition focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white"
              />
            </div>

            <AccountMenu user={user} />

            <CartIconWithBadge href={`/${locale}/cart`} count={safeCartCount} />
          </div>
        </div>
      </div>

      {/* MOBILE TOP BAR */}
      <div className={`lg:hidden ${wrap}`}>
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => setOpen((s) => !s)}
            className="rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          <Link href={`/${locale}`} aria-label="Home">
            <Image
              src={logo}
              alt="Logo"
              width={60}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <button
              className="rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            <AccountMenu user={user} />

            <CartIconWithBadge href={`/${locale}/cart`} count={safeCartCount} />
          </div>
        </div>
      </div>

      {/* BACKDROP */}
      <button
        aria-hidden={!isOpen}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* MOBILE DRAWER */}
      <aside
        className={`fixed left-0 top-0 z-50 h-dvh w-full max-w-[85%] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md">
          <div className={`${wrap} flex items-center justify-between px-0`}>
            <div className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-rose-500" />
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-700">
                {t("login")}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
              aria-label="Close mobile menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100dvh-56px)] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <div className={`${wrap} px-4`}>
            <FeaturedCircles
              title={t("featured")}
              items={[
                {
                  href: `/${locale}/new-arrivals`,
                  label: t("newArrivals"),
                  image: newarrivals,
                  alt: "New Arrivals",
                },
                {
                  href: `/${locale}/kimono`,
                  label: t("kimano"),
                  image: pajama,
                  alt: "Kimono Collection",
                },
              ]}
            />
          </div>

          {/* GROUPS LIST */}
          <nav className="px-2 py-3">
            <h3 className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {/* {t("categories")} */}
            </h3>

            <ul className="flex flex-col">
              {visibleGroups.map((g) => (
                <li key={g.group_id}>
                  <Link
                    href={groupHref(locale, g)}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-100 hover:text-rose-600"
                  >
                    {groupLabel(locale, g)}
                  </Link>
                </li>
              ))}

              <li className="my-3 h-px w-full bg-slate-200" />

              <li className="px-2 py-1">
                <LanguageSwitcher />
              </li>
            </ul>
          </nav>

          <section className={`${wrap} border-b border-slate-100 py-3 px-4`}>
            <h3 className="px-1 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("info")}
            </h3>
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  onClick={() => setOpen(false)}
                  href={`/${locale}/aboutUs`}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-slate-700 hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <span className="inline-flex items-center gap-3">
                    <Info className="h-6 w-6 text-slate-400" />
                    {t("aboutUs")}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  onClick={() => setOpen(false)}
                  href={`/${locale}/contact`}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-slate-700 hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <span className="inline-flex items-center gap-3">
                    <Mail className="h-6 w-6 text-slate-400" />
                    {t("contact")}
                  </span>
                </Link>
              </li>
            </ul>
          </section>

          <div className={`${wrap} mt-6 mb-10 px-4`}>
            <SocialMedia />
          </div>
        </div>
      </aside>
    </nav>
  );
}
