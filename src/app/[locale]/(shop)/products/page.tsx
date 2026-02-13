import Link from "next/link";
import { getCatalogProductsGrouped } from "@/lib/db/products";
import { wrap } from "@/components/UI/primitives";
import { clampPositiveInt } from "@/lib/helpers";
import ProductCard from "@/components/products/ProductCard";
import type { CatalogPageResult } from "@/lib/db/products";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { getTranslations } from "next-intl/server";
import EmptyState from "@/components/UI/EmptyState";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await ctx.params;

  return generateLocalizedMetadata(ctx, {
    namespace: "Products",
    path: `/products/${slug}`,
  });
}

export default async function ProductsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const pageSize = 12;
  const currentPage = clampPositiveInt(sp.page ?? "1", 1);

  const h = await getTranslations({ locale, namespace: "Helpers" });
  const p = await getTranslations({ locale, namespace: "Products" });

  const data = (await getCatalogProductsGrouped({
    page: currentPage,
    pageSize,
  })) as CatalogPageResult;

  const items = data.items?.filter(Boolean) ?? [];
  const totalPages = Math.max(1, data.totalPages ?? 1);

  const prevHref = `?page=${Math.max(1, currentPage - 1)}`;
  const nextHref = `?page=${Math.min(totalPages, currentPage + 1)}`;

  if (items.length === 0) {
    const base = `/${locale}`;

    return (
      <div className="min-h-screen bg-white text-stone-900 selection:bg-stone-100">
        <header className="w-full border-b border-stone-100 py-10">
          <div className={`${wrap} flex flex-col items-center gap-10`}>
            <div className="w-full text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                {h("page")} {currentPage}
              </p>
            </div>
          </div>
        </header>

        <main className={`${wrap} py-20`}>
          <EmptyState
            title={p("empty.title")}
            description={p("empty.description")}
            primaryAction={{
              label: p("empty.primary"),
              href: "?page=1",
            }}
            secondaryAction={{
              label: p("empty.secondary"),
              href: `${base}/products`,
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-stone-100">
      <header className="w-full border-b border-stone-100 py-10">
        <div className={`${wrap} flex flex-col items-center gap-10`}>
          <nav className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
            <div className="flex gap-10 text-stone-400">
              <Link
                href={prevHref}
                className={
                  currentPage === 1
                    ? "opacity-20 pointer-events-none"
                    : "hover:text-black transition-colors"
                }
              >
                {h("previous")}
              </Link>
              <Link
                href={nextHref}
                className={
                  currentPage === totalPages
                    ? "opacity-20 pointer-events-none"
                    : "hover:text-black transition-colors"
                }
              >
                {h("next")}
              </Link>
            </div>

            <div className="hidden md:block font-medium">
              {h("page")} {currentPage}{" "}
              <span className="text-stone-200 mx-2">/</span> {totalPages}
            </div>

            <button className="hover:line-through">{h("filters")}</button>
          </nav>
        </div>
      </header>

      <main className={`${wrap} py-20`}>
        <div className="grid grid-cols-1 gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((pRow, idx) => (
            <ProductCard
              key={pRow.parent_code || idx}
              product={pRow}
              locale={locale}
              revealDelay={idx % 3}
            />
          ))}
        </div>

        <footer className="mt-40 flex flex-col items-center py-20 border-t border-stone-100">
          <div className="flex items-center gap-16">
            <Link
              href={prevHref}
              className={`text-[10px] uppercase tracking-[0.4em] ${
                currentPage === 1
                  ? "opacity-20 pointer-events-none"
                  : "hover:underline underline-offset-8"
              }`}
            >
              {h("backToStart")}
            </Link>
            <div className="h-px w-20 bg-stone-100" />
            <Link
              href={nextHref}
              className={`text-[10px] uppercase tracking-[0.4em] ${
                currentPage === totalPages
                  ? "opacity-20 pointer-events-none"
                  : "hover:underline underline-offset-8"
              }`}
            >
              {h("loadMore")}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
