"use client";

import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Section } from "../UI/primitives";
// your assets
import img1 from "../../assets/hero2.jpg";
import img2 from "../../assets/hero1.jpg";
import img3 from "../../assets/hero3.jpg";
import img4 from "../../assets/hero4.jpg";
import img5 from "../../assets/hero5.jpg";
import img6 from "../../assets/hero6.jpg";
import img7 from "../../assets/hero7.jpg";
import TileCarousel from "../UI/carusels/TileCarousel";
type Tile = { src: StaticImageData; alt: string };

const TILES: Tile[] = [
  { src: img1, alt: "Couple in colorful pajamas" },
  { src: img2, alt: "Man in blue pajamas" },
  { src: img3, alt: "Couple in SpongeBob pajamas" },
  { src: img4, alt: "Colorful Robe" },
  { src: img5, alt: "Couple in matching pajamas" },
  { src: img6, alt: "girl in swimsuit" },
  { src: img7, alt: "Couple in matching underwear" },
];

export default function HeroGallery() {
  const t = useTranslations("Home.Hero");

  return (
    <Section>
      <div className="">
        <div className="hidden xl:grid grid-cols-12 gap-10 py-16 xl:py-20">
          {/*  sidebar  (left) */}
          <aside className="col-span-5 xl:col-span-6 xl:pt-16">
            <div className=" xl:top-20">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl text-[#1C1917] leading-tight tracking-tight drop-shadow-sm">
                {t("h1")}
              </h1>
              <p className="mt-4 text-base xl:text-lg text-[#5c534b] font-light">
                {t("sub")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 xl:gap-4">
                <Link
                  href="/shop?sort=new"
                  className="inline-flex h-12 items-center rounded-2xl bg-red-400 px-6 text-sm font-medium text-white hover:bg-red-400/90 transition"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/size-guide"
                  className="inline-flex h-12 items-center rounded-2xl border border-red-400 px-6 text-sm font-medium text-red-400 hover:bg-red-400 hover:text-white transition"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>
          </aside>

          {/* Masonry gallery (right) */}
          <div className="col-span-7 xl:col-span-6">
            <div className="columns-2 xl:columns-3 gap-6">
              {TILES.map((tile, i) => (
                <figure
                  key={i}
                  className="mb-6 break-inside-avoid rounded-3xl overflow-hidden border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
                >
                  <div className="relative w-full">
                    <div
                      className={
                        i % 5 === 0
                          ? "aspect-[3/4]"
                          : i % 3 === 0
                          ? "aspect-[4/3]"
                          : "aspect-square"
                      }
                    >
                      <Image
                        src={tile.src}
                        alt={tile.alt}
                        fill
                        sizes="(max-width:1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 will-change-transform hover:scale-105"
                        priority={i < 3}
                      />
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet 768–1023 */}
        <div className="hidden md:block xl:hidden py-12">
          
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl text-[#1C1917] leading-tight tracking-tight">
              {t("h1")}
            </h1>
            <p className="mt-3 text-base md:text-lg text-[#5c534b] font-light">
              {t("sub")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/shop?sort=new"
                className="inline-flex h-11 items-center rounded-2xl bg-red-400 px-5 text-sm font-medium text-white hover:bg-red-400/90 transition"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/size-guide"
                className="inline-flex h-11 items-center rounded-2xl border border-red-400 px-5 text-sm font-medium text-red-400 hover:bg-red-400 hover:text-white transition"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>

          {/* Gallery below, 2 columns with tighter gap for tablet */}
          <div className="mt-8 columns-2 gap-4">
            {TILES.map((tile, i) => (
              <figure
                key={i}
                className="mb-4 break-inside-avoid rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
              >
                <div className="relative w-full">
                  <div
                    className={
                      i % 7 === 0
                        ? "aspect-[3/4]"
                        : i % 3 === 0
                        ? "aspect-[4/3]"
                        : "aspect-square"
                    }
                  >
                    <Image
                      src={tile.src}
                      alt={tile.alt}
                      fill
                      sizes="(max-width:1024px) 90vw"
                      className="object-cover"
                      priority={i < 2}
                    />
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden py-10">
          <h1 className=" text-3xl font-semibold tracking-tight text-stone-900">
            {t("h1")}
          </h1>
          <p className="mt-3 text-stone-700 font-light">{t("sub")}</p>
          <div className="mt-5 flex gap-3">
            <Link
              href="/shop?sort=new"
              className="inline-flex h-11 items-center rounded-2xl bg-red-400 px-5 text-sm font-medium text-white hover:bg-red-400/90"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href="/size-guide"
              className="inline-flex h-11 items-center rounded-2xl border border-red-400 px-5 text-sm font-medium text-red-400 hover:bg-red-400 hover:text-white"
            >
              {t("ctaSecondary")}
            </Link>
          </div>

          <TileCarousel tiles={TILES} />
        </div>
      </div>
    </Section>
  );
}
