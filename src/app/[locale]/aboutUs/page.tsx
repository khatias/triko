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
    <main className="bg-white text-[#1a1a1a] selection:bg-[#FF4D37] selection:text-white overflow-x-hidden">
      <Section className="relative overflow-hidden bg-orange-300 px-6 py-16 sm:px-8  lg:px-16 ">
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-16 lg:flex-row lg:gap-12 xl:gap-20">
          {/* Left Content Area */}
          <div className="z-20 w-full flex-1">
            {/* Kept your exact typography style, but smoothed the scaling so it doesn't awkwardly shrink on 'md' */}
            <h2 className="text-5xl font-black uppercase leading-[1.1] tracking-tight text-neutral-50 md:text-6xl lg:text-[5vw] xl:text-[6.5vw]">
              {t("hero.title")}
            </h2>

            <div className="max-w-xl">
              {/* 3. Smoothed the massive spacing jump. mt-40 on md was causing too much dead space. */}
              <div className="mb-8 mt-8 flex items-center gap-4 lg:mt-12">
                <span className="text-[14px] font-black uppercase tracking-[0.3em] text-purple-800">
                  {t("hero.detail")}
                </span>
                <div className="h-px flex-1 bg-neutral-900 opacity-20" />
              </div>

              <div className="relative">
                <p className="text-lg font-light leading-relaxed tracking-tight text-white md:text-xl">
                  {t("hero.description")}
                </p>
              </div>

              <div className="group mt-12 inline-block cursor-pointer md:mt-16">
                <span className="text-[10px] uppercase tracking-[0.5em] text-purple-950">
                  {t("hero.exploreMore")}
                </span>
                <div className="mt-2 h-0.5 w-8 bg-neutral-900 transition-all duration-700 group-hover:w-full" />
              </div>
            </div>
          </div>

          {/* Right Image Area */}
          <div className="relative flex w-full flex-1 justify-center lg:justify-end">
            {/* 4. Fixed Tailwind syntax: 'aspect-[3/4]' is the correct class. Added specific max-widths per breakpoint. */}
            <div className="relative w-full max-w-100 aspect-3/4 overflow-hidden shadow-2xl shadow-neutral-200 md:max-w-112.5 lg:max-w-125">
              <Image
                src="https://jtllowjuurijdjllkzam.supabase.co/storage/v1/object/public/site/hero/image00009.jpeg"
                alt="Triko Cover"
                fill
                className="object-cover transition-transform duration-[2s] hover:scale-110"
                priority
              />
            </div>

            {/* Adjusted the vertical text so it floats cleanly relative to the wrapper */}
            <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 xl:-right-8 xl:block 2xl:-right-12">
              <span className="text-[10px] font-medium uppercase tracking-[1em] text-white [writing-mode:vertical-rl]">
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
              <h2
                className="mb-8  text-orange-500 tracking-tight leading-[1.2]
              text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-5xl "
              >
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

                <h3 className="text-3xl  italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor1")}
                </h3>
              </div>
            </div>

            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  02
                </span>

                <h3
                  className="text-3xl 
                 italic text-neutral-900"
                >
                  {t("whoIsTrikoFor.isTrikoFor2")}
                </h3>
              </div>
            </div>

            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  03
                </span>

                <h3 className="text-3xl italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor3")}
                </h3>
              </div>
            </div>

            <div className="group">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-bold tracking-widest text-red-600">
                  04
                </span>

                <h3 className="text-3xl italic text-neutral-900">
                  {t("whoIsTrikoFor.isTrikoFor4")}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MANIFESTO: High Impact Typography (No Black Box, Pure Text) */}
      <section className="bg-[#fc6759]  text-neutral-50 py-48 px-6 relative">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Small decorative cross */}

          <p className="uppercase tracking-[0.4em] text-[10px] font-bold text-white mb-12">
            {t("goal.title")}
          </p>

          <h2 className="text-4xl md:text-7xl  leading-tight mb-16">
            <span className="block opacity-50 mb-4 text-2xl md:text-3xl font-sans tracking-widest uppercase">
              — {t("goal.slogan1")}
            </span>
            <span className="italic text-[#FFDE85] font-light  border-neutral-800 pb-2 inline-block mx-2">
              {t("goal.slogan2")}
            </span>{" "}
            {t("goal.slogan3")}{" "}
            <span className="italic text-[#FFDE85] font-light  border-neutral-800 pb-2 inline-block mx-2">
              {t("goal.slogan4")}
            </span>
            .
          </h2>
        </div>
      </section>
      <section className="relative w-full py-32 lg:py-48 px-6 bg-[#FFDE85]">
        {/* Subtle texture grid */}

        <div className="absolute inset-0 z-0 opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-size-[64rem_6rem]" />
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-start">
          <div className="space-y-10 pt-10">
            <div className="inline-flex items-center gap-3">
              <span className="w-3 h-3 border border-neutral-900 rounded-full"></span>

              <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-900">
                {t("WhatWeCreate.concept")}
              </span>
            </div>

            <h2
              className="
              mt-4
              font-black uppercase tracking-tight leading-[1.2]
              text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-5xl text-[#fc6759]  "
            >
              {t("WhatWeCreate.title1")} {""}
              <span className="">{t("WhatWeCreate.title2")}</span>
            </h2>

            <p className="text-xl text-neutral-600 font-light leading-relaxed max-w-md">
              {t("WhatWeCreate.desc")}
            </p>
          </div>

          {/* Right: The "Paper Card" Aesthetic */}

          <div className="relative group">
            {/* Background Shadow element */}

            <div className="absolute top-4 left-4 w-full h-full border border-neutral-300 bg-[#fc6759] z-0 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />

            <div className="relative z-10 p-10 md:p-14  bg-orange-300 border border-neutral-200 shadow-sm">
              <h2 className="text-3xl  text-neutral-900 mb-8">
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
            <h2 className="text-5xl md:text-6xl t- text-[#fc6759] mb-8 leading-tight">
              {t("philosophy.title")}
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed font-light mb-10">
              {t("philosophy.desc")}
            </p>
            <Link
              href="/products"
              className="inline-block px-10 py-4 bg-orange-300 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-orange-600 transition-colors duration-300"
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
      <section className="py-32 bg-orange-300 px-6 text-center border-t border-[#EAE8E4]">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-4xl md:text-7xl  tracking-tight mb-8 text-white">
            {t("Georgia.title")}
          </h3>

          <p className="text-xl text-black font-light leading-relaxed mb-16">
            {t("Georgia.desc")}
          </p>
        </div>
      </section>

      <div
        className="bg-[#fc6759]  text-black my-20 px-10 md:px-20"
        id="locations"
      >
        <div className="py-12  border-b border-neutral-800 flex flex-col md:flex-row justify-between md:items-end">
          {/* <h3 className=" text-3xl italic text-white mb-2">
            {t("locations.title")}
          </h3> */}
        </div>

        <div className="bg-[#FFDE85]">
          {stores.map(({ title, address, mapsHref }) => (
            <div
              key={title}
              className="group relative bg-[#FFDE85] hover:bg-[#FFD966] transition-colors duration-300 p-10 md:p-16 min-h-72 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-6"></div>

              <div className="max-w-2xl">
                <h4 className="text-2xl md:text-3xl text-black mb-4 group-hover:translate-x-1 transition-transform duration-300">
                  {title}
                </h4>
                <address className="not-italic text-base text-black font-light leading-relaxed group-hover:text-neutral-800 transition-colors">
                  {address}
                </address>
              </div>

              {mapsHref && (
                <div className="mt-8">
                  <Link
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 border-b border-transparent group-hover:text-black group-hover:border-black transition-all pb-1"
                  >
                    {t("locations.viewOnMap")}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
