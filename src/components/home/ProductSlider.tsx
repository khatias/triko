"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Section } from "../UI/primitives";
import ProductCard from "../products/ProductCard";
import type { CatalogGroupedProductCard } from "@/lib/db/products";
import { useTranslations } from "next-intl";
export default function ProductSlider({
  catalog,
  locale,
}: {
  catalog: CatalogGroupedProductCard[];
  locale?: "en" | "ka";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const t = useTranslations("Home.Slider");
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

    setCanScrollLeft(scrollLeft > 0);

    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [catalog]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;

    const scrollAmount = clientWidth * 0.8;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!catalog?.length) return null;

  return (
    <Section className="pt-12 sm:pt-24">
      <div className="mb-10 flex items-end justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#FF5C5C]">
            {t("subTitle")}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter text-[#383333]">
            {t("title")}
          </h2>
        </div>

        {/* Navigation Controls */}
        <div className="hidden sm:flex gap-3">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="group flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white transition-all duration-300 ease-out hover:border-stone-300 hover:bg-stone-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none active:scale-95"
            aria-label="Scroll left"
            type="button"
          >
            <ChevronLeftIcon className="h-5 w-5 text-stone-600 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#383333] border border-[#383333] text-white transition-all duration-300 ease-out hover:bg-black hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none active:scale-95"
            aria-label="Scroll right"
            type="button"
          >
            <ChevronRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative group/slider">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          // ADDED items-stretch: Forces all cards to match the height of the tallest card
          className="flex items-stretch gap-4 md:gap-6 overflow-x-auto overflow-y-visible px-4 sm:px-6 lg:px-8 pb-12 pt-4 snap-x snap-mandatory scroll-smooth scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {catalog.map((pRow, idx) => (
            <div
              key={pRow.parent_code}
              // ADDED fixed responsive widths (w-[75vw] for mobile, fixed px for larger screens)
              // ADDED h-auto and flex flex-col to allow inner cards to stretch
              className="w-[75vw] sm:w-70 lg:w-[320px] h-auto flex flex-col snap-start shrink-0 transition-transform duration-500 hover:-translate-y-2"
            >
              {/* Note: Ensure your ProductCard accepts className="h-full" or has h-full built in! */}
              <ProductCard
                product={pRow}
                locale={locale as "en" | "ka"}
                revealDelay={idx % 3}
              />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
