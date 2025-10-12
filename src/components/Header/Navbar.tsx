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
import { useTranslations } from "use-intl";
import type { SafeUser } from "@/types/auth";
import AccountMenu from "./AccountMenu";
import { wrap } from "../UI/primitives";
import type { NavItem } from "@/types/Category";
import { MobileItem } from "./MobileItem";
export default function Navbar({
  user,
  categories,
}: {
  user: SafeUser;
  categories: NavItem[];
}) {
  const t = useTranslations("Header");
  const [isOpen, setOpen] = useState(false);

  return (
    <nav className=" border-b border-slate-200/70 bg-white/80 backdrop-blur- supports-[backdrop-filter]:bg-white">
      <div className={`hidden lg:block ${wrap}`}>
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

            <AccountMenu user={user} />
            <ShoppingCartIcon className="h-6 w-6 text-slate-800 cursor-pointer" />
          </div>
        </div>
      </div>

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

            <AccountMenu user={user} />
            <button
              aria-label="Cart"
              className="rounded-md p-1.5 text-slate-800 hover:bg-slate-100"
            >
              <ShoppingCartIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <button
        aria-hidden={!isOpen}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

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
                  href: "/categories/kimono",
                  label: t("kimano"),
                  image: pajama,
                  alt: "Kimono Collection",
                },
              ]}
            />
          </div>

          <div className="h-[calc(100dvh-52px)] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <nav className="px-2 py-3">
              <ul className="flex flex-col">
                {categories.map((item) => (
                  <li key={item.id}>
                    <MobileItem item={item} onNavigate={() => setOpen(false)} />
                  </li>
                ))}
                <li className="my-3 h-px w-full bg-slate-200" />
                <li className="px-2 py-1">
                  <LanguageSwitcher />
                </li>
              </ul>
            </nav>

            <div className={`${wrap} mt-6 mb-10 px-4`}>
              <SocialMedia />
            </div>
          </div>

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
                  href="/aboutUs"
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
