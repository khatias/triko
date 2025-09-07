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
import kimanoex from "../../assets/kimano-ex.jpg";
import FeaturedCircles from "../cards/FeatureCircle";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import SocialMedia from "../socialMedia/SocialMedia";
import { useTranslations } from "use-intl";

const navItems = [
  { name: "Boxers", href: "/Boxeres" },
  { name: "Dress", href: "/Dress" },
  { name: "Pants", href: "/Pants" },
  { name: "Kimano", href: "/kimano" },
  { name: "Shorts", href: "/shorts" },
  { name: "Tops", href: "/Tops" },
  { name: "Kids", href: "/Kids" },
];

export default function Navbar() {
  const t = useTranslations("Header");
  const [isOpen, setOpen] = useState(false);
  const wrap = "container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32";

  return (
    <nav className=" border-b border-slate-200/70 bg-white/80 backdrop-blur- supports-[backdrop-filter]:bg-white">
      {/* DESKTOP BANNER (kept + improved) */}
      <div className={`hidden lg:block ${wrap}`}>
        {/* Banner Row: Language • Logo • Search + User/Cart */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center  py-3">
          <Link href="/" aria-label="Home" className="justify-self-center">
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
                className="h-11 w-[28rem] rounded-xl border border-slate-200/60 bg-white/70 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 shadow-inner transition focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white"
              />
            </div>

            {/* User + Cart visible on DESKTOP banner as requested */}
            <button
              aria-label="Account"
              className="rounded-full p-2 hover:bg-slate-100"
            >
              <UserIcon className="h-6 w-6 text-slate-700" />
            </button>
            <button
              aria-label="Cart"
              className="relative rounded-full p-2 hover:bg-slate-100"
            >
              <ShoppingCartIcon className="h-6 w-6 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE TOPBAR (restored) */}
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

          <Link className="" href="/" aria-label="Home">
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
            <button
              aria-label="Account"
              className="rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
            >
              <UserIcon className="h-6 w-6" />
            </button>
            <button
              aria-label="Cart"
              className="rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
            >
              <ShoppingCartIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <button
        aria-hidden={!isOpen}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* MOBILE DRAWER (restored SocialMedia, Info, Featured) */}
      <aside
        className={`fixed left-0 top-0 z-50 h-[100dvh] w-full max-w-[85%]  transform bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
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
                  href: "/new-arrivals",
                  label: t("newArrivals"),
                  image: newarrivals,
                  alt: "New Arrivals",
                },
                {
                  href: "/kimano",
                  label: t("kimano"),
                  image: kimanoex,
                  alt: "Kimono Collection",
                },
              ]}
            />
          </div>

          <ul className={`${wrap} mt-2 flex flex-col gap-1 px-4`}>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-100 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <span>{item.name}</span>
                  <span className="h-3 w-3 rounded-full bg-slate-200 transition group-hover:bg-rose-300" />
                </Link>
              </li>
            ))}
            <li className="my-2 h-px w-full bg-slate-200" />
          </ul>

          <section className={`${wrap} border-b border-slate-100 py-3 px-4`}>
            <h3 className="px-1 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("info")}
            </h3>
            <ul className="flex flex-col gap-1">
              <li className="pl-1 pb-1">
                <LanguageSwitcher />
              </li>
              <li>
                <Link
                  onClick={() => setOpen(false)}
                  href="/about"
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
                  href="/contact"
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

          <div className={`${wrap} mt-8 mb-10 px-4`}>
            <SocialMedia />
          </div>
        </div>
      </aside>
    </nav>
  );
}
