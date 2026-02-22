import Image from "next/image";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { useTranslations } from "next-intl";
import { Section } from "@/components/UI/primitives";
import Link from "next/link";

type Store = { title: string; address: string; mapsHref?: string };

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "About",
    path: "/about",
  });
}

export default function AboutPage() {
  const t = useTranslations("About");
  const storesRaw = t.raw("locations.items") as Record<string, Store> | Store[];
  const stores: Store[] = Array.isArray(storesRaw)
    ? storesRaw
    : Object.values(storesRaw);

  return (
    <main className="bg-[#F9F8F6] text-[#1a1a1a] selection:bg-[#FF4D37] selection:text-white overflow-x-hidden">
      {/* 1. HERO: Warm & Cinematic */}
      <Section className=" py-20 bg-neutral-200">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-neutral-100 hidden lg:block" />

        <div className="absolute top-45 left-10 pointer-events-none select-none">
          <h2 className="text-[15vw] font-serif text-neutral-50 leading-none tracking-tighter uppercase">
            {t("hero.title")}
          </h2>
        </div>

        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
          <div className="flex-1 lg:pr-20 z-20">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-12">
                <span className="text-[10px] uppercase tracking-[0.6em] font-black text-neutral-900">
                  {t("hero.detail")}
                </span>

                <div className="h-px flex-1 bg-neutral-900 opacity-20" />
              </div>

              <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif tracking-tighter text-neutral-900 leading-[0.8] mb-12">
                {t("hero.title")}
              </h1>

              <div className="relative">
                <p className="text-lg md:text-xl text-neutral-700 font-light leading-relaxed tracking-tight lg:columns-1 gap-12">
                  {t("hero.description")}
                </p>

                <span className="absolute -top-6 -left-4 text-4xl font-serif text-neutral-200"></span>
              </div>

              <div className="mt-16 group cursor-pointer inline-block">
                <span className="uppercase tracking-[0.5em] text-[10px] font-black">
                  {t("hero.exploreMore")}
                </span>

                <div className="mt-2 h-0.5 w-8 bg-neutral-900 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full lg:pl-10 relative">
            <div className="relative aspect-3/4 w-full max-w-lg mx-auto overflow-hidden shadow-2xl shadow-neutral-200">
              <Image
                src="/about/cover.jpeg"
                alt="Triko Cover"
                fill
                className="object-cover transition-transform duration-[2s] hover:scale-110"
                priority
              />
            </div>

            <div className="absolute top-1/2 -right-12 -translate-y-1/2 hidden xl:block">
              <span className="text-[10px] uppercase tracking-[1em] text-white [writing-mode:vertical-rl] font-medium">
                {t("hero.underwear")} • {t("hero.kimano")} • {t("hero.pajamas")}
              </span>
            </div>
          </div>
        </div>
      </Section>

      <section className="px-6 md:px-12 py-32 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-20">
          <div className="lg:w-1/3">
            <div className="sticky top-32">
              <h2 className="text-5xl md:text-6xl font-serif mb-8 leading-none">
                {t("whoIsTrikoFor.title")}
              </h2>

              <div className="h-px w-full bg-neutral-200 mb-8" />

              <p className="text-neutral-500 text-lg leading-relaxed">
                {t("whoIsTrikoFor.desc")}
              </p>
            </div>
          </div>

          <div className="lg:w-2/3 border-l border-neutral-100 pl-0 lg:pl-16 space-y-20">
            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  01
                </span>

                <h3 className="text-3xl font-serif italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor3")}
                </h3>
              </div>
            </div>

            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  02
                </span>

                <h3 className="text-3xl font-serif italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor1")}
                </h3>
              </div>
            </div>

            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  03
                </span>

                <h3 className="text-3xl font-serif italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor2")}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MANIFESTO: High Impact Typography (No Black Box, Pure Text) */}
      <section className="bg-neutral-950 text-neutral-50 py-48 px-6 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Small decorative cross */}

          <div className="w-4 h-4 text-neutral-700 mx-auto mb-12 flex justify-center items-center">
            <div className="w-full h-px bg-current absolute" />

            <div className="h-full w-px bg-current absolute" />
          </div>

          <p className="uppercase tracking-[0.4em] text-[10px] font-bold text-neutral-500 mb-12">
            {t("goal.title")}
          </p>

          <h2 className="text-4xl md:text-7xl font-serif leading-tight mb-16">
            <span className="block opacity-50 mb-4 text-2xl md:text-3xl font-sans tracking-widest uppercase">
              — {t("goal.slogan1")}
            </span>
            <span className="italic text-neutral-400 font-light border-b border-neutral-800 pb-2 inline-block mx-2">
              {t("goal.slogan2")}
            </span>{" "}
            {t("goal.slogan3")}{" "}
            <span className="italic text-neutral-400 font-light border-b border-neutral-800 pb-2 inline-block mx-2">
              {t("goal.slogan4")}
            </span>
            .
          </h2>
        </div>
      </section>
      <section className="relative w-full py-32 lg:py-48 px-6 bg-[#f4f4f0]">
        {/* Subtle texture grid */}

        <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-size-[64rem_6rem]" />

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start">
          {/* Left: Typography */}

          <div className="space-y-10 pt-10">
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 border border-neutral-900 rounded-full"></span>

              <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900">
                {t("WhatWeCreate.concept")}
              </span>
            </div>

            <h2 className="text-6xl lg:text-7xl font-serif text-neutral-900 leading-[0.9]">
              {t("WhatWeCreate.title1")} <br />
              <span className="italic text-neutral-500">
                {t("WhatWeCreate.title2")}
              </span>
            </h2>

            <p className="text-xl text-neutral-600 font-light leading-relaxed max-w-md">
              {t("WhatWeCreate.desc")}
            </p>
          </div>

          {/* Right: The "Paper Card" Aesthetic */}

          <div className="relative group">
            {/* Background Shadow element */}

            <div className="absolute top-4 left-4 w-full h-full border border-neutral-300 bg-neutral-200/50 z-0 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />

            <div className="relative z-10 p-10 md:p-14 bg-[#fcfcfc] border border-neutral-200 shadow-sm">
              <h2 className="text-3xl font-serif text-neutral-900 mb-8">
                {t("FabricsAndQuality.title")}
              </h2>

              <p className="text-neutral-600 leading-relaxed text-lg font-light mb-10">
                {t("FabricsAndQuality.desc")}
              </p>

              <button className="text-xs font-black uppercase tracking-[0.25em] text-neutral-900 border-b-2 border-transparent hover:border-neutral-900 transition-all pb-1">
                {t("FabricsAndQuality.seeMore")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PHILOSOPHY: Full Width Cinematic */}
      <section className="relative py-32 lg:py-48 px-6 bg-white border-t border-[#EAE8E4]">
        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-16">
          {/* Text */}
          <div className="lg:w-1/2">
            <span className="text-xs tracking-[0.3em] uppercase text-neutral-400 font-bold block mb-6">
              Est. 2021
            </span>
            <h2 className="text-5xl md:text-6xl font-serif text-[#1a1a1a] mb-8 leading-tight">
              {t("philosophy.title")}
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed font-light mb-10">
              {t("philosophy.desc")}
            </p>
            <Link
              href="/products"
              className="inline-block px-10 py-4 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#FF4D37] transition-colors duration-300"
            >
              {t("philosophy.discoverCollection")}
            </Link>
          </div>

          {/* Image */}
          <div className="lg:w-1/2 relative">
            <div className="relative aspect-4/5 w-full max-w-lg mx-auto">
              <Image
                src="/about/philosophy.jpg"
                alt="Philosophy"
                fill
                sizes="100vw"
                className="object-cover transition-all duration-1000"
                priority={false}
              />

              {/* Outline Border Offset */}
              <div className="absolute inset-0 border border-[#1a1a1a] transform translate-x-4 translate-y-4 -z-10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. OUTRO: Warm & Clean */}
      <section className="py-32 bg-[#F9F8F6] px-6 text-center border-t border-[#EAE8E4]">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-5xl md:text-7xl font-serif tracking-tighter mb-8 text-[#1a1a1a]">
            {t("Georgia.title")}
          </h3>

          <p className="text-xl text-neutral-500 font-light leading-relaxed mb-16">
            {t("Georgia.desc")}
          </p>

          <p className="text-[10px] uppercase tracking-[0.6em] text-[#FF4D37] font-bold">
            Triko Studio — 2026
          </p>
        </div>
      </section>

      <Section
        className="bg-[#111] text-white"
        labelledBy="about-locations"
        id="locations"
      >
        <div className="px-6 md:px-12 py-12 border-b border-neutral-800 flex flex-col md:flex-row justify-between md:items-end">
          <h3 className="font-serif text-3xl italic text-white mb-2">
            {t("locations.title")}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
            {t("locations.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {stores.map(({ title, address, mapsHref }, idx) => (
            <div
              key={title}
              className="group relative bg-[#111] hover:bg-[#1a1a1a] transition-colors duration-300 p-10 min-h-70 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-[10px] text-neutral-600 group-hover:text-white transition-colors">
                  0{idx + 1}
                </span>
                {mapsHref && (
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 group-hover:bg-[#FF4D37] transition-colors" />
                )}
              </div>

              <div>
                <h4 className="text-xl text-white font-serif mb-4 group-hover:translate-x-1 transition-transform duration-300">
                  {title}
                </h4>
                <address className="not-italic text-sm text-neutral-400 font-light leading-relaxed group-hover:text-neutral-200 transition-colors">
                  {address}
                </address>
              </div>

              {mapsHref && (
                <div className="mt-8">
                  <Link
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-500 border-b border-transparent group-hover:text-white group-hover:border-white transition-all pb-1"
                  >
                    {t("locations.viewOnMap")}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
