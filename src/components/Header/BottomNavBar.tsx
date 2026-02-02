// src/components/Header/BottomNavBar.tsx
import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { wrap, linkBase } from "../UI/primitives";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import { useTranslations } from "next-intl";
import type { ShopGroup } from "@/lib/db/groups";

function getGroupLabel(locale: "en" | "ka", g: ShopGroup) {
  const ka = String(g.name_ka ?? "").trim();
  const en = String(g.name_en ?? "").trim();
  const fallback = String(g.fina_name ?? "").trim();

  if (locale === "ka") return ka || en || fallback || "Untitled";
  return en || ka || fallback || "Untitled";
}

function safeSlug(g: ShopGroup) {
  const s = String(g.slug_en ?? "").trim();
  return s.length ? s : null;
}

type Props = {
  locale: "en" | "ka";
  groups: ShopGroup[];
  maxVisible?: number;
  basePath?: string;
  allGroupsHref?: string;
};

export default function BottomNavBar({
  locale,
  groups,
  maxVisible = 6,
  allGroupsHref,
}: Props) {
  const clean = (groups ?? []).filter((g) => safeSlug(g) !== null);

  const main = clean.slice(0, maxVisible);
  const overflow = clean.slice(maxVisible);
  const t = useTranslations("Header");

  const groupHref = (g: ShopGroup) => {
    const slug = safeSlug(g);
    return `/${locale}/${slug}`;
  };

  const allHref = allGroupsHref ?? `/${locale}`;

  return (
    <nav className="border-t border-gray-100 bg-white">
      <ul
        className={`${wrap} hidden lg:flex items-center w-full py-4 text-lg font-semibold tracking-wider gap-12 relative`}
      >
        {/* Main visible items */}
        {main.map((g) => (
          <li key={g.group_id} className="relative shrink-0">
            <Link href={groupHref(g)} className={linkBase}>
              {getGroupLabel(locale, g)}
            </Link>
          </li>
        ))}

        {/* Overflow / "See More" Dropdown */}
        {overflow.length > 0 && (
          <li className="group relative shrink-0">
            {/* Trigger Area */}
            {/* Added 'py-2' to trigger to ensure vertical connection */}
            <div className="flex cursor-pointer items-center gap-1 py-2">
              <Link href={allHref} className={linkBase}>
                {t("seeMore")}
              </Link>
              <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:rotate-180" />
            </div>

            {/* THE FIX: 
               1. 'pt-2' creates an invisible bridge so the mouse doesn't cross a gap.
               2. 'top-full' positions it right at the bottom edge of the trigger.
            */}
            <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 ease-in-out group-hover:visible group-hover:opacity-100">
              {/* Actual Visual Card (Background, Shadow, Border) */}
              <div className="min-w-88 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
                {/* View All Button */}
                <Link
                  href={allHref}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-rose-700/90 hover:bg-rose-50 hover:text-rose-700"
                >
                  {t("viewAll")}
                </Link>

                <div className="my-2 h-px bg-slate-200" />

                {/* Grid of extra items */}
                <ul className="grid grid-cols-2 gap-1 max-h-[60vh] overflow-auto custom-scrollbar">
                  {overflow.map((g) => (
                    <li key={g.group_id}>
                      <Link
                        href={groupHref(g)}
                        className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-rose-600"
                      >
                        {getGroupLabel(locale, g)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        )}

        {/* Language Switcher pushed to right */}
        <li className="ml-auto shrink-0">
          <LanguageSwitcher />
        </li>
      </ul>
    </nav>
  );
}
