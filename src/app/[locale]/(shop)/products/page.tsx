import Link from "next/link";
import { getCatalogProductsGrouped } from "@/lib/db/products";
import { wrap } from "@/components/UI/primitives";
import { clampPositiveInt } from "@/lib/helpers";
import ProductCard from "@/components/products/ProductCard";
import type { CatalogPageResult } from "@/lib/db/products";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { getTranslations } from "next-intl/server";
import EmptyState from "@/components/UI/EmptyState";
import { getVisibleGroups, type ShopGroup } from "@/lib/db/groups";
import FiltersDrawer from "@/components/products/FiltersDrawer";
import Filter from "@/components/products/Filter";
import { collectDescendantGroupIds } from "@/lib/groups-tree";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    sizes?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    categoryId?: string;
  }>;
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

function clampQuery(v: string) {
  return v.replace(/\s+/g, " ").trim().slice(0, 80);
}

function buildHref(sp: URLSearchParams, nextPage: number) {
  const next = new URLSearchParams(sp.toString());
  next.set("page", String(nextPage));
  const qs = next.toString();
  return qs ? `?${qs}` : "?page=1";
}

function parseIntOrNull(v?: string) {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

type GroupRow = Pick<ShopGroup, "group_id" | "parent_group_id">;

function buildQueryParams(spRaw: Awaited<PageProps["searchParams"]>) {
  const sp = new URLSearchParams();

  const q = clampQuery(spRaw.q ?? "");
  if (q) sp.set("q", q);

  if (spRaw.sizes) sp.set("sizes", spRaw.sizes);
  if (spRaw.minPrice) sp.set("minPrice", spRaw.minPrice);
  if (spRaw.maxPrice) sp.set("maxPrice", spRaw.maxPrice);
  if (spRaw.sort) sp.set("sort", spRaw.sort);
  if (spRaw.categoryId) sp.set("categoryId", spRaw.categoryId);

  return sp;
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const spRaw = await searchParams;

  const pageSize = 12;
  const currentPage = clampPositiveInt(spRaw.page ?? "1", 1);

  const q = clampQuery(spRaw.q ?? "");
  const sizes = spRaw.sizes ? spRaw.sizes.split(",") : null;
  const minPrice = spRaw.minPrice ? Number(spRaw.minPrice) : null;
  const maxPrice = spRaw.maxPrice ? Number(spRaw.maxPrice) : null;
  const sort = (spRaw.sort as "price_asc" | "price_desc" | "newest") || null;

  // 1. Fetch translations and groups in parallel
  const [groups, h, p] = await Promise.all([
    getVisibleGroups(),
    getTranslations({ locale, namespace: "Helpers" }),
    getTranslations({ locale, namespace: "Products" })
  ]);

  const selectedId = parseIntOrNull(spRaw.categoryId);
  let groupIds: number[] | null = null;
  
  if (selectedId != null) {
    const rows: GroupRow[] = groups.map((g) => ({
      group_id: g.group_id,
      parent_group_id: g.parent_group_id ?? null,
    }));

    const descendants = collectDescendantGroupIds(rows, selectedId);
    groupIds = [selectedId, ...descendants];
  }

  // 2. Fetch the data using the calculated groupIds
  const data = (await getCatalogProductsGrouped({
    page: currentPage,
    pageSize,
    q: q ? q : null,
    sizes,
    minPrice: Number.isFinite(minPrice as number) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice as number) ? maxPrice : null,
    sort,
    groupIds,
  })) as CatalogPageResult;

  const items = data.items?.filter(Boolean) ?? [];
  const totalPages = Math.max(1, data.totalPages ?? 1);

  const sp = buildQueryParams(spRaw);
  const prevHref = buildHref(sp, Math.max(1, currentPage - 1));
  const nextHref = buildHref(sp, Math.min(totalPages, currentPage + 1));

  const base = `/${locale}`;
  const primaryHref = `/${locale}/products`;

  function HeaderBar() {
    return (
      <header className="border-b border-stone-100">
        <div className={`${wrap} h-20 flex items-center`}>
          <nav className="w-full flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
            <div className="flex gap-8 text-stone-400 min-w-40">
              <Link
                href={prevHref}
                prefetch={false}
                className={
                  currentPage === 1
                    ? "opacity-20 pointer-events-none"
                    : "hover:text-stone-900 transition-colors"
                }
              >
                {h("previous")}
              </Link>

              <Link
                href={nextHref}
                prefetch={false}
                className={
                  currentPage === totalPages
                    ? "opacity-20 pointer-events-none"
                    : "hover:text-stone-900 transition-colors"
                }
              >
                {h("next")}
              </Link>
            </div>

            <div className="hidden md:block text-stone-500 tabular-nums min-w-35 text-center">
              {h("page")} {currentPage}{" "}
              <span className="text-stone-200 mx-2">/</span> {totalPages}
            </div>

            <div className="lg:hidden min-w-14 flex justify-end">
              <FiltersDrawer groups={groups} />
            </div>

            <div className="hidden lg:block min-w-14" aria-hidden />
          </nav>
        </div>
      </header>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white text-stone-900">
        <HeaderBar />
        <main className={`${wrap} py-14 lg:flex lg:gap-12`}>
          <aside className="hidden lg:block w-70 shrink-0">
            <Filter groups={groups} />
          </aside>
          <div className="flex-1">
            <EmptyState
              title={p("empty.title")}
              description={p("empty.description")}
              primaryAction={{ label: p("empty.primary"), href: primaryHref }}
              secondaryAction={{
                label: p("empty.secondary"),
                href: `${base}/products`,
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-stone-900">
      <HeaderBar />
      <main className={`${wrap} py-14 flex flex-col lg:flex-row gap-12`}>
        <aside className="hidden lg:block w-70 shrink-0">
          <Filter groups={groups} />
        </aside>

        <div className="flex-1">
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((row, idx) => (
              <ProductCard
                key={row.parent_code || idx}
                product={row}
                locale={locale}
                revealDelay={idx % 3} 
              />
            ))}
          </div>

          <footer className="mt-20 flex justify-center gap-8 pt-8 border-t border-stone-100">
            <Link
              href={prevHref}
              prefetch={false}
              className={`text-xs uppercase tracking-wider ${
                currentPage === 1
                  ? "opacity-20 pointer-events-none"
                  : "text-stone-500 hover:text-stone-900 transition-colors"
              }`}
            >
              {h("backToStart")}
            </Link>

            <Link
              href={nextHref}
              prefetch={false}
              className={`text-xs uppercase tracking-wider ${
                currentPage === totalPages
                  ? "opacity-20 pointer-events-none"
                  : "text-stone-500 hover:text-stone-900 transition-colors"
              }`}
            >
              {h("loadMore")}
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}