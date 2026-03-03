import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  ArrowUpRightIcon,
  StarIcon,
  FireIcon,
} from "@heroicons/react/24/solid";
import { Section } from "../UI/primitives";

type Locale = "en" | "ka";

type HeroRow = {
  key: string;
  is_active: boolean;
  image_main_path: string | null;
  image_side_path: string | null;

  main_image_label_en: string;
  main_image_label_ka: string;

  main_card_label_en: string;
  main_card_label_ka: string;

  title_en: string;
  title_ka: string;

  subtitle_en: string;
  subtitle_ka: string;

  cta_primary_href: string;
  cta_secondary_href: string;

  info_tag_en: string;
  info_tag_ka: string;

  info_title_en: string;
  info_title_ka: string;

  info_subtitle_en: string;
  info_subtitle_ka: string;

  details_label_en: string;
  details_label_ka: string;
};

function localized(row: HeroRow, locale: Locale) {
  const pick = <T,>(ka: T, en: T) => (locale === "ka" ? ka : en);

  return {
    mainImageLabel: pick(row.main_image_label_ka, row.main_image_label_en),
    seasonLabel: pick(row.main_card_label_ka, row.main_card_label_en),
    title: pick(row.title_ka, row.title_en),
    subtitle: pick(row.subtitle_ka, row.subtitle_en),
    infoTag: pick(row.info_tag_ka, row.info_tag_en),
    infoTitle: pick(row.info_title_ka, row.info_title_en),
    infoSubtitle: pick(row.info_subtitle_ka, row.info_subtitle_en),
    detailsLabel: pick(row.details_label_ka, row.details_label_en),
  };
}

function splitLines(input: string) {
  const normalized = input
    .replaceAll("\\n", "\n")
    .replaceAll("/n", "\n")
    .trim();
  return normalized ? normalized.split("\n") : [];
}

function Lines({ text }: { text: string }) {
  const lines = splitLines(text);
  if (lines.length <= 1) return <>{text}</>;

  return (
    <>
      {lines.map((line, i) => (
        <span key={`${i}-${line}`}>
          {line}
          {i < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </>
  );
}

function safeHref(locale: Locale, href: string) {
  const p = href?.startsWith("/") ? href : `/${href ?? ""}`;
  return `/${locale}${p}`.replaceAll("//", "/");
}

export default async function Hero({ locale }: { locale: Locale }) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_hero")
    .select("*")
    .eq("key", "home_hero")
    .maybeSingle<HeroRow>();

  if (error) throw new Error(error.message);
  if (!data || !data.is_active) return null;

  const copy = localized(data, locale);

  const mainUrl = data.image_main_path
    ? supabase.storage.from("site").getPublicUrl(data.image_main_path).data
        .publicUrl
    : null;

  const sideUrl = data.image_side_path
    ? supabase.storage.from("site").getPublicUrl(data.image_side_path).data
        .publicUrl
    : null;

  return (
    <Section className="py-10 sm:py-12 lg:py-16">
      <div
        className="
          grid gap-4 lg:gap-6
          grid-cols-1
          md:grid-cols-12 md:auto-rows-fr
        "
      >
        <div
          className="
            group relative overflow-hidden rounded-[2.25rem] bg-stone-100
            aspect-4/5 sm:aspect-16/10
            md:col-span-6 md:row-span-2 md:aspect-auto md:min-h-130
            lg:min-h-155
          "
        >
          {mainUrl ? (
            <Image
              src={mainUrl}
              alt="Main Look"
              fill
              priority
              quality={95}
              sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : null}

          <div className="pointer-events-none absolute left-5 top-5 sm:left-6 sm:top-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
              <FireIcon className="h-5 w-5 text-[#FF5C5C]" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#383333]">
                {copy.mainImageLabel}
              </span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: Big red card */}
        <div
          className="
            relative overflow-hidden rounded-[2.25rem]
            bg-[#fc6759] p-7 sm:p-8 lg:p-12 text-white
            md:col-span-6 md:row-span-1
            min-h-65 sm:min-h-75
          "
        >
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-black/10 blur-3xl" />

          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-white" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white">
              {copy.seasonLabel}
            </span>
          </div>

          <h1
            className="
              mt-4
              font-black uppercase tracking-tight leading-[1.2]
              text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-5xl text-[#FFDE85]
            "
          >
            <Lines text={copy.title} />
          </h1>

          <div className="mt-6 flex items-end justify-between gap-5">
            <p className="max-w-[18rem] text-sm font-medium leading-relaxed text-white/85">
              {copy.subtitle}
            </p>

            <Link
              href={safeHref(locale, data.cta_primary_href)}
              aria-label="Open primary CTA"
              className="
                inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center
                rounded-full bg-white text-[#FF5C5C] shadow-xl
                transition-transform hover:scale-105 active:scale-95
                hover:bg-[#FFDE85] hover:text-[#383333]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF5C5C]
              "
            >
              <ArrowUpRightIcon className="h-6 w-6" />
            </Link>
          </div>
        </div>

        {/* BLOCK 3: Side image (hidden on mobile, appears on lg) */}
        <div
          className="
            group relative hidden overflow-hidden rounded-[2.25rem] bg-stone-100
            lg:block lg:col-span-2 lg:row-span-1
          "
        >
          {sideUrl ? (
            <Image
              src={sideUrl}
              alt="Detail Shot"
              fill
              quality={90}
              sizes="(min-width: 1024px) 18vw, 0px"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-xs font-bold uppercase tracking-widest text-white">
              View
            </span>
          </div>
        </div>

        {/* BLOCK 4: Info card (fills remaining space nicely) */}
        <div
          className="
            relative overflow-hidden rounded-[2.25rem] bg-[#FFDE85] flex flex-col justify-center
            p-5 sm:p-8 text-[#383333]
            md:col-span-6
            lg:col-span-4
            min-h-55 sm:min-h-65
          "
        >
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-white/25 blur-[1px]" />

          <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-stone-600">
            {copy.infoTag}
          </span>

          <h2
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight
              leading-none text-[#FF5C5C]"
          >
            <Lines text={copy.infoTitle} />
          </h2>

          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-stone-600/80">
            {copy.infoSubtitle}
          </p>

          <Link
            href={safeHref(locale, data.cta_secondary_href)}
            className="
              absolute bottom-5 right-5 sm:bottom-6 sm:right-6
              rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-tight leading-[1.2]
              transition-colors
              hover:bg-[#FF5C5C]  hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#383333]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFDE85]
            "
          >
            {copy.detailsLabel}
          </Link>
        </div>
      </div>
    </Section>
  );
}
