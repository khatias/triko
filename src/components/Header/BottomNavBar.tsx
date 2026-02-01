// src/components/Header/BottomNavBar.tsx
import React from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { wrap, linkBase } from "../UI/primitives";
import LanguageSwitcher from "../toggle/LanguageSwitcher";

// adjust this import to your real file path
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

  const groupHref = (g: ShopGroup) => {
    const slug = safeSlug(g);
    return `/${locale}/${slug}`;
  };

  const allHref = allGroupsHref ?? `/${locale}`;

  return (
    <ul
      className={`${wrap} hidden lg:flex items-center bg-white border-t border-gray-100 w-full py-4 text-lg font-semibold tracking-wider gap-12`}
    >
      {main.map((g) => (
        <li key={g.group_id} className="relative">
          <Link href={groupHref(g)} className={linkBase}>
            {getGroupLabel(locale, g)}
          </Link>
        </li>
      ))}

      {overflow.length > 0 && (
        <li className="group relative">
          <div className="flex items-center gap-1">
            <Link href={allHref} className={linkBase}>
              More
            </Link>
            <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-hover:rotate-180" />
          </div>

          <div className="invisible absolute right-0 top-full z-50 mt-2 min-w-[22rem] rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
            <Link
              href={allHref}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-rose-700/90 hover:bg-rose-50 hover:text-rose-700"
            >
              View all
            </Link>

            <div className="my-2 h-px bg-slate-200" />

            <ul className="grid grid-cols-2 gap-1 max-h-[60vh] overflow-auto">
              {overflow.map((g) => (
                <li key={g.group_id}>
                  <Link
                    href={groupHref(g)}
                    className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600"
                  >
                    {getGroupLabel(locale, g)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </li>
      )}

      <li className="ml-auto">
        <LanguageSwitcher />
      </li>
    </ul>
  );
}
