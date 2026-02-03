"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { Variant } from "@/lib/db/products";
import { buildSizes, formatPrice } from "@/lib/helpers";
import { useAddToCart } from "@/lib/cart/useAddToCart";
import { getFinaIdFromVariant } from "@/utils/fina/ids";

type ProductDetailClientProps = {
  locale: string;
  title: string;
  photos: string[];
  variants: Variant[];
  groupName: string;
  description: string;

  // fallback label (range)
  basePriceLabel: string;

  currency?: string | null;
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

  const sizeRows = useMemo(() => buildSizes(variants), [variants]);

  const selectedRow = useMemo(() => {
    if (!selected) return null;
    return sizeRows.find((r) => r.label === selected) ?? null;
  }, [selected, sizeRows]);

  const selectedVariant = useMemo(() => {
    const row = selectedRow;
    if (!row) return null;
    if (!row.inStock) return null;
    return row.variant ?? null;
  }, [selectedRow]);

  const selectedFinaId = useMemo(() => {
    if (!selectedVariant) return null;
    return getFinaIdFromVariant(selectedVariant);
  }, [selectedVariant]);

  const activePhoto = photos[active] ?? null;

  const h = useTranslations("Helpers");
  const t = useTranslations("Products");
  const cartT = useTranslations("Cart");

  const { onAdd, isPending, err, toast } = useAddToCart({
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

  const canAdd = !!selectedVariant && !!selectedFinaId && !isPending;

  // ===== Price block that switches when size selected =====
  const priceBlock = useMemo(() => {
    // default: show range label
    if (!selectedVariant) {
      return (
        <p className="text-3xl font-light text-stone-800 tracking-tight">
          {basePriceLabel}
        </p>
      );
    }

    const eff = selectedVariant.price ?? null;
    const list = selectedVariant.list_price ?? null;

    const effLabel = money(eff, currency);
    const listLabel = money(list, currency);

    // prefer DB flag but also infer if needed
    const hasDiscount =
      (selectedVariant.has_discount ?? null) === true ||
      (eff != null && list != null && eff < list);

    // if we cannot format effective price -> fallback to base
    if (!effLabel) {
      return (
        <p className="text-3xl font-light text-stone-800 tracking-tight">
          {basePriceLabel}
        </p>
      );
    }

    if (hasDiscount && listLabel) {
      return (
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-light text-stone-800 tracking-tight">
            {effLabel}
          </span>
          <span className="text-sm text-stone-400 line-through font-medium">
            {listLabel}
          </span>
          <span className="text-[10px] uppercase tracking-[0.25em] font-black text-[#B45309]">
            {t("sale")}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-light text-stone-800 tracking-tight">
          {effLabel}
        </span>
      </div>
    );
  }, [selectedVariant, basePriceLabel, currency, t]);

  return (
    <div className="relative grid gap-16 lg:grid-cols-12 items-start pt-4">
      {toast ? (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-100 bg-stone-900/95 backdrop-blur-xl text-[#D4AF37] px-8 py-4 rounded-full text-[10px] tracking-[0.4em] uppercase shadow-2xl border border-stone-700 animate-in fade-in zoom-in-95 duration-300">
          {toast}
        </div>
      ) : null}

      {/* LEFT */}
      <div className="lg:col-span-7 space-y-8">
        <div
          ref={imgRef}
          onMouseEnter={() => setIsZooming(true)}
          onMouseLeave={() => setIsZooming(false)}
          onMouseMove={handleMouseMove}
          className="relative aspect-4/5 overflow-hidden rounded-[40px] bg-[#F5F5F0] cursor-crosshair group shadow-sm border border-stone-100"
        >
          {activePhoto ? (
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={activePhoto}
                alt={title}
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out"
                style={{
                  transform: isZooming ? "scale(1.4)" : "scale(1)",
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[40px] pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 grid place-items-center text-stone-400 text-sm">
              {h("noImages")}
            </div>
          )}

          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-opacity duration-300 pointer-events-none ${
              isZooming ? "opacity-0" : "opacity-100"
            }`}
          >
            <span className="bg-white/80 backdrop-blur px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] text-stone-500 font-bold border border-stone-200 shadow-sm">
              {h("rollToZoom")}
            </span>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-4 justify-center">
          {photos.map((pht, i) => {
            const isActive = active === i;
            return (
              <button
                key={`${pht}-${i}`}
                type="button"
                aria-label={t("viewPhoto", { n: i + 1 })}
                onClick={() => setActive(i)}
                className={`relative h-28 w-20 shrink-0 rounded-2xl overflow-hidden transition-all duration-500 ${
                  isActive
                    ? "ring-1 ring-stone-900 ring-offset-4 scale-105"
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                <Image
                  src={pht}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
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

          {/* PRICE */}
          <div className="pt-4">{priceBlock}</div>

          {/* Selected size line */}
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
              const disabled = !row.inStock || isPending || !row.variant;
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

          {!selected ? (
            <p className="text-[10px] uppercase tracking-widest text-stone-400">
              {t("chooseSize")}
            </p>
          ) : selectedRow && !selectedRow.inStock ? (
            <p className="text-[10px] uppercase tracking-widest text-red-700">
              {t("outOfStock")}
            </p>
          ) : null}
        </div>

        {/* Purchase Button */}
        <div className="space-y-4">
          <button
            type="button"
            disabled={!canAdd}
            onClick={() => {
              if (selectedVariant) onAdd(selectedVariant);
            }}
            className="group relative w-full h-20 rounded-full bg-stone-900 overflow-hidden transition-all active:scale-[0.98] shadow-xl hover:shadow-stone-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative z-10 text-white group-hover:text-stone-900 text-[12px] font-black uppercase tracking-[0.5em] transition-colors duration-500">
              {isPending ? t("adding") : t("addToCart")}
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
  );
}
