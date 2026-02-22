import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";

export default function StorySlice() {
  const t = useTranslations("About.goal");

  return (
    <section className="mx-auto max-w-400 px-4 py-16 sm:px-8 sm:py-24">
      {/* The Architectural Block: Zero curves, sharp borders */}
      <div className="relative w-full border border-white/10 bg-[#383333] px-6 py-16 sm:p-20 lg:p-24">
        {/* Massive Background Watermark */}
        <div className="pointer-events-none absolute -left-10 top-0 select-none opacity-[0.03]">
          <h2 className="whitespace-nowrap text-[25vw] font-black uppercase leading-none text-white">
            {t("title")}
          </h2>
        </div>

        {/* The Grid Layout */}
        <div className="relative z-10 flex flex-col gap-16 lg:flex-row lg:gap-0 lg:divide-x lg:divide-white/10">
          {/* Left Half: The Manifesto */}
          <div className="flex w-full flex-col items-start justify-center lg:w-1/2 lg:pr-20">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-0.5 w-12 bg-[#FFDE85]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFDE85]">
                {t("Cardtitle")}
              </span>
            </div>

            <h3 className="text-5xl font-black uppercase leading-[0.9] text-white sm:text-6xl lg:text-7xl">
              {t("title")}
            </h3>

            {/* THE FIX: One cohesive sentence. 
                Using `text-balance` stops the awkward word wrapping.
                Using `span` lets us colorize parts of the sentence without breaking it apart.
            */}
            <div className="mt-10 max-w-xl">
              <p className="text-2xl font-medium leading-relaxed text-white text-balance sm:text-3xl lg:leading-snug">
                {t("slogan1")}{" "}
                <span className="text-[#FFDE85]">{t("slogan2")}</span>{" "}
                <span className="text-white/70">{t("slogan3")}</span>{" "}
                <span className="text-white/70">{t("slogan4")}</span>
              </p>
            </div>

            {/* Brutalist Geometric CTA Button */}
            <div className="mt-14">
              <Link
                href="/aboutUs"
                className="group flex w-fit items-stretch border border-[#FFDE85] bg-transparent text-[#FFDE85] transition-colors duration-300 hover:bg-[#FFDE85] hover:text-[#383333]"
              >
                <span className="flex items-center px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">
                  {t("readButton")}
                </span>
                <div className="flex items-center justify-center border-l border-[#FFDE85] px-5 transition-colors duration-300 group-hover:border-[#383333]/20">
                  <ArrowUpRightIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </Link>
            </div>
          </div>

          {/* Right Half: Sharp Editorial Images */}
          <div className="relative flex w-full lg:w-1/2 lg:pl-20">
            <div className="relative z-10 w-[85%] border border-white/10 bg-black aspect-3/4 sm:w-[75%]">
              <Image
                src="https://agmtedbqerhsjdttekpb.supabase.co/storage/v1/object/public/site/hero/main.jpg"
                alt={t("title")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90 transition-opacity duration-700 hover:opacity-100"
              />
            </div>
            <div className="absolute bottom-10 right-0 z-20 hidden w-[45%] border-8 border-[#383333] bg-[#383333] aspect-square sm:block lg:-right-4">
              <div className="relative h-full w-full border border-white/10">
                <Image
                  src="https://agmtedbqerhsjdttekpb.supabase.co/storage/v1/object/public/site/hero/main.jpg"
                  alt="Texture detail"
                  fill
                  sizes="33vw"
                  className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
