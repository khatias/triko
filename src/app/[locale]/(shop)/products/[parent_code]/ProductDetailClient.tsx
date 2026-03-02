// src/app/[locale]/products/[parent_code]/ProductDetailClient.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { Variant as DbVariant } from "@/lib/db/products";
import { buildSizes, formatPrice } from "@/lib/helpers";
import { useAddToCart } from "@/lib/cart/useAddToCart";
import {
  getFinaIdFromVariant,
  getBundleFinaIdsFromVariant,
} from "@/utils/fina/ids";

type ProductDetailClientProps = {
  locale: string;
  title: string;
  photos: string[];
  variants: DbVariant[];
  groupName: string;
  description: string;
  basePriceLabel: string;
  currency?: string | null;
};

type Variant = DbVariant & {
  price?: number | null;
  list_price?: number | null;
  has_discount?: boolean | null;
  parent_code?: string | null;
  top_fina_id?: number | string | null;
  bottom_fina_id?: number | string | null;
};

type BundleMeta = {
  parentCode: string | null;
  titleEn: string;
  titleKa: string;
  imageUrl: string | null;
};

function money(v: number | null, currency: string | null): string | null {
  if (v == null) return null;
  return formatPrice(v, currency);
}

export default function ProductDetailClient({
  locale,
  title,
  photos,
  variants,
  groupName,
  description,
  basePriceLabel,
  currency = "GEL",
}: ProductDetailClientProps) {
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const [isZooming, setIsZooming] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // ✅ smoother loading
  const [heroLoaded, setHeroLoaded] = useState(false);

  const h = useTranslations("Helpers");
  const t = useTranslations("Products");
  const cartT = useTranslations("Cart");

  const sizeRows = useMemo(() => buildSizes(variants as Variant[]), [variants]);

  const selectedRow = useMemo(() => {
    if (!selected) return null;
    return sizeRows.find((r) => r.label === selected) ?? null;
  }, [selected, sizeRows]);

  const selectedVariant = useMemo(() => {
    const row = selectedRow;
    if (!row) return null;
    if (!row.inStock) return null;
    return (row.variant as Variant) ?? null;
  }, [selectedRow]);

  const selectedSingleFinaId = useMemo(() => {
    if (!selectedVariant) return null;
    return getFinaIdFromVariant(selectedVariant as DbVariant);
  }, [selectedVariant]);

  const selectedBundleIds = useMemo(() => {
    if (!selectedVariant) return null;
    return getBundleFinaIdsFromVariant(selectedVariant as DbVariant);
  }, [selectedVariant]);

  const activePhoto = photos[active] ?? null;

  const { onAdd, onAddBundle, isPending, pendingFinaId, err, toast } =
    useAddToCart({
      locale,
      qty: 1,
      successMessage: t("addedToCart"),
    });

  function parseAvailable(msg: string): string | null {
    const m = /available\s+([0-9]+(?:\.[0-9]+)?)/i.exec(msg);
    return m?.[1] ?? null;
  }
  const available = err ? parseAvailable(err) : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const canAdd =
    !!selectedVariant &&
    !isPending &&
    (selectedSingleFinaId != null || selectedBundleIds != null);

  const bundleMeta: BundleMeta = useMemo(
    () => ({
      parentCode: selectedVariant?.parent_code ?? null,
      titleEn: title,
      titleKa: title,
      imageUrl: activePhoto ?? photos?.[0] ?? null,
    }),
    [selectedVariant, title, activePhoto, photos],
  );

  const isSinglePending =
    selectedSingleFinaId != null &&
    pendingFinaId === selectedSingleFinaId &&
    isPending;

  const isBundlePending =
    selectedBundleIds != null &&
    pendingFinaId === selectedBundleIds.top &&
    isPending;

  const isThisSelectionPending = isSinglePending || isBundlePending;

  const priceBlock = useMemo(() => {
    if (!selectedVariant) {
      return (
        <p className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
          {basePriceLabel}
        </p>
      );
    }

    const eff = selectedVariant.price ?? null;
    const list = selectedVariant.list_price ?? null;

    const effLabel = money(eff, currency);
    const listLabel = money(list, currency);

    const hasDiscount =
      selectedVariant.has_discount === true ||
      (eff != null && list != null && eff < list);

    if (!effLabel) {
      return (
        <p className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
          {basePriceLabel}
        </p>
      );
    }

    if (hasDiscount && listLabel) {
      return (
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <span className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
            {effLabel}
          </span>
          <span className="text-sm text-stone-400 line-through font-semibold">
            {listLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-black text-[#B45309]">
              {t("sale")}
            </span>
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-end gap-3">
        <span className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-950">
          {effLabel}
        </span>
      </div>
    );
  }, [selectedVariant, basePriceLabel, currency, t]);

  function goPrevPhoto() {
    if (!photos.length) return;
    setActive((x) => (x - 1 + photos.length) % photos.length);
  }
  function goNextPhoto() {
    if (!photos.length) return;
    setActive((x) => (x + 1) % photos.length);
  }

  useEffect(() => {
    // ✅ reset loader when photo changes
    setHeroLoaded(false);
  }, [active]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrevPhoto();
      if (e.key === "ArrowRight") goNextPhoto();
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, photos.length]);

  return (
    <div className="relative">
      {toast ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-9999">
          <div className="rounded-full border border-stone-200 bg-white/90 backdrop-blur-xl px-5 py-3 shadow-2xl">
            <p className="text-[10px] tracking-[0.35em] uppercase font-extrabold text-stone-900">
              {toast}
            </p>
          </div>
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-10000 bg-black/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsLightboxOpen(false);
          }}
        >
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-[12px] tracking-[0.22em] uppercase font-black border border-white/15"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={goPrevPhoto}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center"
            aria-label="Previous image"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={goNextPhoto}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center"
            aria-label="Next image"
          >
            ›
          </button>

          <div className="absolute inset-x-4 top-16 bottom-8 md:inset-x-16 md:top-16 md:bottom-12">
            <div className="relative w-full h-full">
              {activePhoto ? (
                <Image
                  src={activePhoto}
                  alt={title}
                  fill
                  sizes="80vw"
                  className="object-contain"
                  unoptimized
                  quality={60}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto  px-4 sm:px-6 lg:px-8 py-6 ">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* MEDIA */}
          <div className="lg:col-span-7">
            <div className="grid gap-4 lg:grid-cols-[96px_1fr]">
              {/* thumbs */}
              <div className="order-2 lg:order-1">
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                  {photos.map((pht, i) => {
                    const isActive = active === i;
                    return (
                      <button
                        key={`${pht}-${i}`}
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={t("viewPhoto", { n: i + 1 })}
                        className={[
                          "relative h-20 w-16 lg:h-20 lg:w-20 shrink-0 overflow-hidden rounded-2xl border transition-all",
                          isActive
                            ? "border-stone-950 ring-2 ring-stone-950/25"
                            : "border-stone-200 opacity-70 hover:opacity-100 hover:border-stone-400",
                        ].join(" ")}
                      >
                        <Image
                          src={pht}
                          alt="photoThumbnail"
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                          quality={60}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* hero */}
              <div className="order-1 lg:order-2">
                <div
                  ref={imgRef}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  className="relative overflow-hidden rounded-[28px] bg-stone-50 border border-stone-200"
                >
                  <div className="relative aspect-4/5">
                    {/* ✅ loading layer */}
                    <div
                      className={[
                        "absolute inset-0 bg-stone-100",
                        "transition-opacity duration-500",
                        heroLoaded ? "opacity-0" : "opacity-100",
                      ].join(" ")}
                    >
                      <div className="absolute inset-0 animate-pulse bg-linear-to-br from-stone-200/60 via-stone-100 to-stone-200/60" />
                    </div>

                    {activePhoto ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsLightboxOpen(true)}
                          className="absolute inset-0 z-10 cursor-zoom-in"
                          aria-label="Open image"
                        />
                        <Image
                          fetchPriority="auto"
                          src={activePhoto}
                          alt={title}
                          fill
                          priority={active === 0}
                          sizes="(min-width: 700px) 60vw, 100vw"
                          unoptimized
                          quality={60}
                          className={[
                            "object-cover transition-[transform,opacity] duration-500 ease-out",
                            heroLoaded ? "opacity-100" : "opacity-0",
                          ].join(" ")}
                          style={{
                            transform: isZooming ? "scale(1.18)" : "scale(1)",
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                          }}
                          onLoadingComplete={() => setHeroLoaded(true)}
                        />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 via-transparent to-transparent" />
                        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[28px]" />
                      </>
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-stone-400 text-sm">
                        {h("noImages")}
                      </div>
                    )}

                    {/* ✅ arrows visible on mobile */}
                    <div className="absolute left-5 right-5 bottom-5 flex items-center justify-between z-20">
                      <div className="rounded-full bg-white/80 backdrop-blur px-4 py-2 border border-stone-200">
                        <span className="text-[9px] uppercase tracking-[0.22em] text-stone-600 font-black">
                          {h("rollToZoom")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={goPrevPhoto}
                          className="h-10 w-10 rounded-full bg-white/85 hover:bg-white border border-stone-200 text-stone-900 font-black"
                          aria-label="Previous"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={goNextPhoto}
                          className="h-10 w-10 rounded-full bg-white/85 hover:bg-white border border-stone-200 text-stone-900 font-black"
                          aria-label="Next"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* dots */}
                <div className="mt-4 flex items-center justify-center gap-2 lg:hidden">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActive(i)}
                      aria-label={`Go to image ${i + 1}`}
                      className={[
                        "h-2 rounded-full transition-all",
                        active === i ? "w-8 bg-stone-950" : "w-2 bg-stone-300",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* INFO (no card, no heavy shadow) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-16 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="h-px w-8 bg-[#D4AF37]" />
                <span className="text-[10px] tracking-[0.5em] text-stone-400 uppercase font-black">
                  {groupName}
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[1.1] tracking-tight">
                {title}
              </h1>

              <div className="pt-4">{priceBlock}</div>

              {selectedVariant ? (
                <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
                  {t("selectedSize")}{" "}
                  <span className="text-stone-700 font-bold">{selected}</span>
                </p>
              ) : null}
            </div>

            {/* Size Selection */}
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-stone-100 pb-2">
                <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-stone-800">
                  {t("chooseSize")}
                </span>

                <Link
                  href="#"
                  className="text-[10px] text-stone-400 font-serif italic hover:text-stone-600 transition-colors"
                >
                  {t("sizeGuide")}
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                {sizeRows.map((row) => {
                  const v = (row.variant as DbVariant | null) ?? null;
                  const singleId = v ? getFinaIdFromVariant(v) : null;
                  const bundleIds = v ? getBundleFinaIdsFromVariant(v) : null;

                  const disabled =
                    !row.inStock ||
                    isPending ||
                    !v ||
                    (singleId == null && bundleIds == null);

                  const isSelected = selected === row.label;

                  return (
                    <button
                      key={row.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (!disabled) setSelected(row.label);
                      }}
                      className={`w-14 h-14 rounded-full text-[11px] font-bold transition-all duration-300 border
                    ${
                      isSelected
                        ? "bg-stone-900 text-white border-stone-900 shadow-lg"
                        : "bg-white text-stone-900 border-stone-200 hover:border-stone-400"
                    }
                    ${disabled ? "opacity-20 cursor-not-allowed grayscale" : ""}`}
                    >
                      {row.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase */}
            <div className="space-y-4">
              <button
                type="button"
                disabled={!canAdd}
                onClick={() => {
                  if (!selectedVariant) return;

                  if (selectedSingleFinaId != null) {
                    onAdd(selectedVariant as DbVariant);
                    return;
                  }

                  if (selectedBundleIds != null) {
                    onAddBundle(selectedVariant as DbVariant, bundleMeta);
                    return;
                  }
                }}
                className="group relative w-full h-20 rounded-full bg-stone-900 overflow-hidden transition-all active:scale-[0.98] shadow-xl hover:shadow-stone-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative z-10 text-white group-hover:text-stone-900 text-[12px] font-black uppercase tracking-[0.5em] transition-colors duration-500">
                  {isThisSelectionPending ? t("adding") : t("addToCart")}
                </span>
              </button>

              {err ? (
                <p className="text-[10px] uppercase tracking-wide text-red-700">
                  {available
                    ? cartT("errors.onlyLeft", { available })
                    : cartT("errors.notEnoughStock")}
                </p>
              ) : null}
            </div>

            {/* Description */}
            <div className="pt-8 space-y-4 border-t border-stone-100">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-stone-900">
                {t("description")}
              </h4>
              <p className="text-sm leading-relaxed text-stone-600 font-light font-serif italic">
                {description}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
