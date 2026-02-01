import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/helpers";
import ProductCard from "@/components/products/ProductCard";
import { getGroupBySlug } from "@/lib/db/groups";
import { getCatalogProductsGrouped } from "@/lib/db/products";
import { wrap } from "@/components/UI/primitives";
import { RESERVED_TOP_LEVEL_SLUGS } from "@/lib/helpers";
import { pickGroupName } from "@/lib/helpers";
import { getTranslations } from "next-intl/server";
type Props = {
  params: Promise<{ locale: Locale; category: string }>;
};

export default async function CategorySlugPage({ params }: Props) {
  const { locale, category } = await params;
  const h = await getTranslations({ locale, namespace: "Helpers" });

  // Prevent the [category] route from catching non-category routes (e.g. /products, /cart).
  if (RESERVED_TOP_LEVEL_SLUGS.has(category)) notFound();

  const group = await getGroupBySlug(category);
  if (!group) notFound();

  const { items: products } = await getCatalogProductsGrouped({
    groupId: group.group_id,
    page: 1,
    pageSize: 48,
  });

  const groupName = pickGroupName(group, locale);

  return (
    <div className="min-h-screen bg-white text-stone-900 selection:bg-stone-100">
      <main className={`${wrap} py-12 md:py-20`}>
        <nav className="mb-8 text-[10px] uppercase tracking-[0.2em] text-stone-400">
          <Link
            href={`/${locale}`}
            className="hover:text-stone-900 transition-colors"
          >
             {h("home")}
          </Link>
          <span className="mx-3">/</span>
          <span className="text-stone-900">{groupName}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-serif tracking-tight">
          {groupName}
        </h1>

        {products.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-stone-100 bg-white p-10 text-stone-600">
            {h("noProductsFound")}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p, idx) => (
              <ProductCard
                key={p.parent_code || idx}
                product={p}
                locale={locale}
                revealDelay={idx % 3}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
