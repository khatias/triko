"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { ChevronRight, Info, Mail } from "lucide-react";
import Image from "next/image";
import logo from "../../assets/logo.png";
import newarrivals from "../../assets/new-arrivals.jpg";
import kimanoex from "../../assets/kimano-ex.jpg";
import { useTranslations } from "use-intl";
import FeaturedCircles from "../cards/FeatureCircle";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import SocialMedia from "../socialMedia/SocialMedia";

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
  const container = "mx-auto max-w-3xl";
  const linkBase =
    "text-sm font-medium text-slate-700 transition-colors hover:text-red-600";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 ">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((s) => !s)}
            className="lg:hidden rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
            aria-label="Toggle mobile menu"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          <MagnifyingGlassIcon className="h-6 w-6 cursor-pointer text-slate-600 hover:text-red-500" />
        </div>

        <Link href="/" aria-label="Home">
          <Image
            src={logo}
            alt="Logo"
            width={60}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>
        {/* desktop links for now */}
        <div className="hidden items-center gap-6 lg:flex">
          {/* <ul className="flex items-center gap-6">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.href} className={linkBase}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul> */}

          {/* <div className="ml-2 flex items-center gap-4 text-sm">
            <Link href="/about" className="text-slate-600 hover:text-red-600">
              About Us
            </Link>
            <Link href="/contact" className="text-slate-600 hover:text-red-600">
              Contact
            </Link>
          </div> */}

          {/* <button className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500">
            {t("login")}
          </button> */}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <UserIcon className="h-6 w-6 cursor-pointer text-slate-700" />
          <ShoppingCartIcon className="h-6 w-6 cursor-pointer text-slate-600 hover:text-[#f3cad2]" />
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

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 h-[100dvh] w-full max-w-[85%] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md">
          <div className={`${container} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <UserIcon className="h-6 w-6 text-[#bb6f7d]" />
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
          <div className={`${container}`}>
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

          <ul className={`${container} mt-2 flex flex-col gap-1 px-2`}>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  onClick={() => setOpen(false)}
                  href={item.href}
                  className="group flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <span>{item.name}</span>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </li>
            ))}

            <li className="my-2 h-px w-full bg-slate-200" />
          </ul>

          <section className={`${container} border-b border-slate-100 py-3`}>
            <h3 className="px-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t("info")}
            </h3>
            <ul className="flex flex-col gap-1 px-2">
              <li className="pl-1 pb-1">
                <LanguageSwitcher />
              </li>
              <li>
                <Link
                  onClick={() => setOpen(false)}
                  href="/about"
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-slate-700 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <span className="inline-flex items-center gap-3">
                    <Info className="h-6 w-6 text-slate-400" />
                    {t("aboutUs")}
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              </li>
              <li>
                <Link
                  onClick={() => setOpen(false)}
                  href="/contact"
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] text-slate-700 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <span className="inline-flex items-center gap-3">
                    <Mail className="h-6 w-6 text-slate-400" />
                    {t("contact")}
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
              </li>
            </ul>
          </section>

          <div className="mt-10 mb-30">
            <SocialMedia />
          </div>
        </div>
      </aside>
    </nav>
  );
}
