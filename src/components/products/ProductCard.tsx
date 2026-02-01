"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { CatalogGroupedProductCard, Variant } from "@/lib/db/products";
import {
  displayTitle,
  formatPrice,
  getFirstPhotoUrl,
  normalizeSize,
  buildSizes,
} from "@/lib/helpers";

import { useTranslations } from "use-intl/react";
type AddToCartItem = {
  parent_code: string;
  variant_code: string;
  title: string;
  price: number | null;
  currency: string | null;
  photo: string | null;
  size: string | null;
  qty: number;
};

function useCart() {
  return {
    addItem: (item: AddToCartItem) => {
      console.log("Adding item to cart:", item);
    },
  };
}

export default function ProductCard({
  product,
  locale,
  revealDelay,
}: {
  product: CatalogGroupedProductCard;
  locale: string;
  revealDelay: number;
}) {
  const { addItem } = useCart();
  const h = useTranslations("Helpers");
  const p = useTranslations("Products");
  const title = displayTitle(product, locale as "en" | "ka");
  const photo = getFirstPhotoUrl(
    product.photos as
      | string
      | string[]
      | { url: string }
      | { url: string }[]
      | null
      | undefined,
  );
  const priceLabel = formatPrice(product.min_price, product.currency);

  const sizeRows = useMemo(
    () => buildSizes(product.variants ?? null),
    [product.variants],
  );

  const delayClass =
    revealDelay === 0
      ? "reveal-delay-0"
      : revealDelay === 1
        ? "reveal-delay-1"
        : "reveal-delay-2";

  function onAdd(variant: Variant) {
    addItem({
      parent_code: product.parent_code,
      variant_code: variant.code ?? product.parent_code,
      title,
      price: variant.price ?? product.min_price ?? null,
      currency: variant.currency ?? product.currency ?? null,
      photo: photo ?? null,
      size: normalizeSize(variant.size),
      qty: 1,
    });
  }

  return (
    <div className={`group animate-reveal ${delayClass}`}>
      <div className="relative">
        <Link
          href={`/${locale}/products/${product.parent_code}`}
          className="block"
        >
          {/* IMAGE BOX */}
          <div className="relative aspect-[4/5] overflow-hidden bg-[#F7F7F7] ring-1 ring-stone-100 transition-all duration-700 group-hover:ring-stone-200">
            {photo ? (
              <>
                <Image
                  src={photo}
                  alt={title}
                  fill
                  className={[
                    "object-cover",
                    "transition-transform duration-[1600ms] ease-out will-change-transform",
                    "group-hover:scale-[1.10] group-hover:rotate-[0.35deg] group-hover:translate-y-[-1.5%]",
                  ].join(" ")}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority={false}
                />

                {/* glossy sweep */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute -inset-y-10 -left-1/2 w-1/3 rotate-12 bg-white/25 blur-[2px] animate-shine group-hover:[animation-play-state:running]" />
                </div>

                {/* vignette */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0 opacity-70" />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-stone-400">
                {h("noImages")}
              </div>
            )}

            {/* HOVER SIZE + ADD TO BAG DRAWER */}
            <div className="absolute inset-x-0 bottom-0 translate-y-full p-6 transition-transform duration-500 ease-out group-hover:translate-y-0">
              <div className="bg-white/60 backdrop-blur-xl border border-white/20 shadow-xl">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-stone-900">
                    {p("addToCart")}
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-stone-500">
                    {p("sizes")}
                  </span>
                </div>

                <div className="px-4 pb-4 flex flex-wrap justify-center gap-2">
                  {sizeRows.length > 0 ? (
                    sizeRows.slice(0, 8).map((row) => {
                      const v = row.variant;
                      const disabled = !row.inStock || !v;
                      return (
                        <button
                          key={row.label}
                          type="button"
                          disabled={disabled}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!disabled && v) onAdd(v);
                          }}
                          className={[
                            "px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-tight ring-1",
                            "transition-all duration-300",
                            disabled
                              ? "cursor-not-allowed opacity-40 ring-stone-200 text-stone-700"
                              : "ring-black/5 text-stone-900 hover:bg-stone-900 hover:text-white",
                          ].join(" ")}
                          aria-label={`Add size ${row.label} to bag`}
                          title={
                            disabled ? "Not available" : `Add ${row.label}`
                          }
                        >
                          {row.label}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[9px] uppercase tracking-widest text-stone-700">
                      Open for details
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INFO AREA */}
          <div className="mt-10">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-6 transition-colors group-hover:border-stone-300">
              <div className="space-y-1.5 min-w-0">
                <h3 className="truncate text-[13px] font-medium uppercase tracking-[0.2em] text-stone-900">
                  {title}
                </h3>
                <p className="text-[10px] font-light uppercase tracking-[0.3em] text-stone-400">
                  {product.variants?.[0]?.name ?? "Permanent collection"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-serif-display italic text-lg text-stone-900">
                  {priceLabel || "—"}
                </p>
                <div className="mt-1 h-[1px] w-0 bg-stone-900 transition-all duration-500 group-hover:w-full ml-auto" />
              </div>
            </div>

            <div className="mt-3 overflow-hidden">
              <span className="block translate-y-full text-[9px] font-bold uppercase tracking-[0.2em] transition-transform duration-500 group-hover:translate-y-0">
                {h("explorePiece")} →
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
