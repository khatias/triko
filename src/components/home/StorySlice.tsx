import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowUpRightIcon } from "@heroicons/react/24/solid";

export default function StorySlice() {
  const t = useTranslations("About.goal");

  return (
    <section className="mx-auto max-w-400 px-4 py-16 sm:px-8 sm:py-24">
      <div className="relative w-full border border-white/10 bg-[#7a5ea0] px-6 py-16 sm:p-12 md:p-16 lg:p-24">
        {/* Background Watermark */}
        <div className="pointer-events-none absolute -left-10 top-0 select-none opacity-[0.03]">
          <h2 className="whitespace-nowrap text-[25vw] font-black uppercase leading-none text-white">
            {t("title")}
          </h2>
        </div>

        <div className="relative z-10 flex flex-col gap-16 md:gap-20 lg:flex-row lg:gap-0 lg:divide-x lg:divide-white/10">
          
          {/* Left Half: The Manifesto */}
          <div className="flex w-full flex-col items-start justify-center lg:w-1/2 lg:pr-20">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-0.5 w-12 bg-white" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                {t("Cardtitle")}
              </span>
            </div>

            <h3 className="text-5xl font-black uppercase leading-[0.9] text-white md:text-6xl lg:text-7xl">
              {t("title")}
            </h3>

            <div className="mt-8 max-w-xl md:mt-10">
              <p className="text-2xl font-medium leading-relaxed text-white text-balance md:text-3xl lg:leading-snug">
                {t("slogan1")}{" "}
                <span className="text-white">{t("slogan2")}</span>{" "}
                <span className="text-white">{t("slogan3")}</span>{" "}
                <span className="text-white">{t("slogan4")}</span>
              </p>
            </div>

            <div className="mt-10 md:mt-14">
              <Link
                href="/aboutUs"
                className="group flex w-fit items-stretch border border-white bg-transparent text-white transition-colors duration-300 hover:bg-[#ffcde9] "
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
          <div className="relative mx-auto flex w-full max-w-[500px] justify-center md:max-w-[600px] lg:mx-0 lg:w-1/2 lg:max-w-none lg:justify-start lg:pl-20">
            
            {/* THE FIX: 
                1. Changed base aspect ratio to `aspect-[4/3]` (landscape-ish) for mobile/tablet to stop the heavy crop.
                2. Added `lg:aspect-square` to return to your original brutalist square on desktop.
                3. Constrained the width tightly on `md` to `w-[75%]` so it doesn't blow up in scale.
            */}
            <div className="relative z-10 w-[90%] border border-white/10 bg-black aspect-[4/3] md:w-[75%] lg:w-[90%] lg:aspect-square">
              <Image
                src="https://jtllowjuurijdjllkzam.supabase.co/storage/v1/object/public/site/hero/image00071.jpeg"
                alt={t("title")}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90 transition-opacity duration-700 hover:opacity-100"
              />
            </div>

            <div className="absolute -bottom-4 -right-4 z-20 hidden w-[45%] border-8 border-[#383333] bg-[#383333] aspect-square sm:block lg:-right-4 lg:bottom-5">
              <div className="relative h-full w-full border border-white/10">
                <Image
                  src="https://jtllowjuurijdjllkzam.supabase.co/storage/v1/object/public/site/hero/image00071.jpeg"
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