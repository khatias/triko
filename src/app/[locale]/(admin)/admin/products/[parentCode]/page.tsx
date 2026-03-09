// src/app/[locale]/(admin)/admin/products/[parentCode]/page.tsx
import "server-only";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { fetchAdminParentProduct } from "./_queries/productDetail";
import ProductEditorClient from "./_components/ProductEditorClient";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; parentCode: string }>;
}) {
  const { locale, parentCode: raw } = await params;
  const t = await getTranslations("Admin.ProductEdit");

  // Fix URL encoding issues:
  // - decode %xx sequences
  // - convert spaces back to "+" (some routers/servers treat "+" as space)
  const parentCode = decodeURIComponent(raw).replaceAll(" ", "+");

  const row = await fetchAdminParentProduct(locale, parentCode);
  if (!row) return notFound();

  return (
    <main className="min-h-screen bg-zinc-50/50 pb-20 pt-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href={`/${locale}/admin/products`}
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            {t("breadcrumbs.products")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {row.parent_code}
          </span>
        </nav>

        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>

          <Link
            href={`/${locale}/admin/products`}
            className="group flex shrink-0 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            {t("back")}
          </Link>
        </div>

        <ProductEditorClient locale={locale} row={row} />
      </div>
    </main>
  );
}