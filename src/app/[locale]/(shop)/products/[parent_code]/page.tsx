// src/app/[locale]/products/[parent_code]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  getCatalogProductDetail,
  type CatalogProductDetail,
} from "@/lib/db/products";
import { wrap } from "@/components/UI/primitives";
import {
  displayTitle,
  displayDescription,
  displayGroupName,
  formatPrice,
  getPhotoUrls,
} from "@/lib/helpers";

import ProductDetailClient from "./ProductDetailClient";

type Locale = "en" | "ka";

type PageProps = {
  params: Promise<{ locale: Locale; parent_code: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, parent_code } = await params;

  const [h, product] = await Promise.all([
    getTranslations({ locale, namespace: "Helpers" }),
    getCatalogProductDetail(
      parent_code,
    ) as Promise<CatalogProductDetail | null>,
  ]);

  if (!product) notFound();

  const title = displayTitle(product, locale);
  const description = displayDescription(product, locale) ?? "";
  const groupName = displayGroupName(product, locale);
  const photos = getPhotoUrls(product.photos);
  const priceLabel = formatPrice(product.min_price, product.currency) ?? "";

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 selection:bg-stone-200 selection:text-stone-900 font-sans">
      <div
        className="pointer-events-none fixed inset-0 z-50 bg-[url('/noise.png')] opacity-[0.015] mix-blend-multiply"
        aria-hidden="true"
      />

      <main className={`${wrap} relative py-12 `}>
        <nav
          aria-label="Breadcrumb"
          className="mb-16 flex items-center space-x-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-400"
        >
          <Link
            href={`/${locale}`}
            className="hover:text-stone-900 transition-all duration-300 hover:tracking-[0.3em]"
          >
            {h("home")}
          </Link>
          <span className="w-4 h-px bg-stone-300" aria-hidden="true" />
          <span className="text-stone-900" aria-current="page">
            {groupName}
          </span>
        </nav>

        <ProductDetailClient
          locale={locale}
          title={title}
          photos={photos}
          variants={product.variants ?? []}
          groupName={groupName}
          description={description}
          basePriceLabel={priceLabel}
        />
      </main>
    </div>
  );
}
