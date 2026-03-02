"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";
import { Section } from "../UI/primitives";
import { useMemo, useState } from "react";
import { FeaturedGroup } from "@/lib/db/groups";
import { useTranslations } from "next-intl";

import { pickGroupName } from "@/lib/helpers";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "groups";

function toPublicImageUrl(dbPath: string | null | undefined): string | null {
  if (!dbPath) return null;

  const s = dbPath.trim();
  if (!s) return null;

  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  let clean = s.replace(/^\/+/, "");

  if (clean === BUCKET) return null;
  if (clean.startsWith(`${BUCKET}/`)) clean = clean.slice(BUCKET.length + 1);

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${clean}`;
}

export default function CategoryAccordion({
  featuredGroups,
  locale,
}: {
  featuredGroups: FeaturedGroup[];
  locale: "ka" | "en";
}) {
  const [activeId, setActiveId] = useState<string | null>(
    featuredGroups?.[0]?.group_id?.toString?.() ?? null,
  );

  const t = useTranslations("Home.Groups");
  const groups = useMemo(() => {
    return featuredGroups.map((g) => ({
      ...g,
      imageUrl: toPublicImageUrl(g.featured_home_image_path),
    }));
  }, [featuredGroups]);
  return (
    <Section className="py-8 sm:py-12">
      <div className="mb-10 flex items-center justify-between px-2">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#FF5C5C] ">
          {t("title")}
        </h2>
        <span className="hidden text-xs font-bold uppercase tracking-widest text-stone-400 sm:block">
          {t("subTitle")}
        </span>
      </div>

      {/* DESKTOP (Horizontal Accordion) */}
      <div className="hidden h-150 w-full gap-4 lg:flex">
        {groups.map((group) => {
          const id = group.group_id.toString();
          const isActive = activeId === id;

          return (
            <div
              key={group.group_id}
              onMouseEnter={() => setActiveId(id)}
              className={`
                relative flex cursor-pointer flex-col overflow-hidden rounded-[2.25rem]
                transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                ${isActive ? "flex-3" : "flex-1 hover:flex-[1.2]"}
              `}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                {group.imageUrl ? (
                  <Image
                    src={group.imageUrl}
                    alt={
                      locale === "ka"
                        ? (group.featured_home_alt_ka ??
                          group.name_ka ??
                          "კატეგორია")
                        : (group.featured_home_alt_en ??
                          group.name_en ??
                          "Category")
                    }
                    fill
                    className={`
                      object-cover transition-transform duration-1000
                      ${isActive ? "scale-100 grayscale-0" : "scale-110 grayscale"}
                    `}
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority={isActive}
                  />
                ) : (
                  <div className="absolute inset-0 bg-stone-200" />
                )}

                <div
                  className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${
                    isActive ? "opacity-0" : "opacity-100"
                  }`}
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8">
                <div className="relative overflow-hidden">
                  <div
                    className={`
                      absolute bottom-0 left-0 origin-bottom-left -rotate-90 whitespace-nowrap
                      text-4xl font-black uppercase tracking-widest text-white/50
                      transition-opacity duration-500
                      ${isActive ? "opacity-0 translate-y-10" : "opacity-100 delay-100"}
                    `}
                  >
                    {pickGroupName(group, locale)}
                  </div>

                  <div
                    className={`
                      transition-all duration-500 transform
                      ${isActive ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}
                    `}
                  >
                    <div className="max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                      <span
                        className="mb-2 block text-xs font-bold uppercase tracking-widest"
                        style={{ color: "#383333" }}
                      >
                        {pickGroupName(group, locale)}
                      </span>

                      <h3 className="text-5xl font-black uppercase leading-none text-white">
                        {pickGroupName(group, locale)}
                      </h3>

                      <Link
                        href={group.slug_en ? `/${group.slug_en}` : "#"}
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase text-[#383333] transition-colors hover:bg-[#FFDE85]"
                      >
                        {t("explore")} <ArrowUpRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MOBILE (Vertical Accordion) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {groups.map((group) => {
          const id = group.group_id.toString();
          const isActive = activeId === id;

          return (
            <div
              key={group.group_id}
              onClick={() => setActiveId(id)}
              className={`
                relative flex w-full cursor-pointer flex-col overflow-hidden rounded-4xl
                transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
                ${isActive ? "h-105" : "h-24"}
              `}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                {group.imageUrl ? (
                  <Image
                    src={group.imageUrl}
                    alt={
                      group.featured_home_alt_en ?? group.name_en ?? "Category"
                    }
                    fill
                    className={`
                      object-cover transition-transform duration-1000
                      ${isActive ? "scale-100 grayscale-0" : "scale-110 grayscale"}
                    `}
                    sizes="100vw"
                    priority={isActive}
                  />
                ) : (
                  <div className="absolute inset-0 bg-stone-200" />
                )}

                {/* Dark overlay for contrast */}
                <div
                  className={`absolute inset-0 bg-black/50 transition-opacity duration-500 ${
                    isActive ? "opacity-20" : "opacity-100"
                  }`}
                />
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-5">
                {/* Inactive State Label (Centered Vertically) */}
                <div
                  className={`
                    absolute top-1/2 left-6 -translate-y-1/2 transition-all duration-500
                    ${isActive ? "opacity-0 -translate-x-10" : "opacity-100 translate-x-0 delay-100"}
                  `}
                >
                  <h3 className="text-xl font-black uppercase tracking-widest text-white/90">
                    {group.name_en}
                  </h3>
                </div>

                {/* Active State Glass Card */}
                <div
                  className={`
                    transition-all duration-500 transform w-full
                    ${isActive ? "translate-y-0 opacity-100 delay-200" : "translate-y-10 opacity-0 pointer-events-none"}
                  `}
                >
                  <div className="w-full rounded-3xl border border-white/20 bg-black/20 p-6 backdrop-blur-md shadow-2xl">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-white/80 drop-shadow">
                      0{group.group_id} — {pickGroupName(group, locale)}
                    </span>

                    <h3 className="text-4xl font-black uppercase leading-none text-white drop-shadow-lg">
                    
                    {pickGroupName(group, locale)}
                    </h3>

                    <Link
                      href={group.slug_en ? `/${group.slug_en}` : "#"}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-sm font-bold uppercase text-[#383333] transition-colors active:scale-95 active:bg-[#FFDE85]"
                    >
                      Explore <ArrowUpRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
