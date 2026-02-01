import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import type { CatalogProductDetail } from "@/lib/db/products";
import { getCatalogProductDetail } from "@/lib/db/products";
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

  const t = await getTranslations({ locale, namespace: "Products" });
  const h = await getTranslations({ locale, namespace: "Helpers" });

  const product = (await getCatalogProductDetail(parent_code)) as CatalogProductDetail | null;
  if (!product) notFound();

  const title = displayTitle(product, locale);
  const description = displayDescription(product, locale);
  const groupName = displayGroupName(product, locale);

  const photos = getPhotoUrls(product.photos);
  const priceLabel = formatPrice(product.min_price, product.currency) ?? "";

  const homeHref = `/${locale}` as const;

  return (
    <div className="min-h-screen bg-[#FCFCFA] text-stone-900 selection:bg-stone-900 selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50" />

      <main className={`${wrap} relative py-12 md:py-20`}>
        <nav className="mb-10 text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <Link href={homeHref} className="hover:text-stone-900 transition-colors">
            {h("home")}
          </Link>
          <span className="mx-3">/</span>
          <span className="text-stone-900">{groupName}</span>
        </nav>

        <ProductDetailClient
          title={title}
          photos={photos}
          groupName={groupName}
          description={description}
          basePriceLabel={priceLabel}
          variants={Array.isArray(product.variants) ? product.variants : []}
        />

        <footer className="mt-32 border-t border-stone-100 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-[11px] uppercase tracking-[0.15em] text-stone-500">
            <div>
              <p className="font-bold text-stone-900 mb-4">{t("Craftsmanship")}</p>
              <p className="leading-relaxed">{t("Craftsmanshipdesc")}</p>
            </div>
            <div>
              <p className="font-bold text-stone-900 mb-4">{t("Shipping")}</p>
              <p className="leading-relaxed">{t("Shippingdesc")}</p>
            </div>
            <div>
              <p className="font-bold text-stone-900 mb-4">{t("Assistance")}</p>
              <p className="leading-relaxed">{t("Assistancedesc")}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
