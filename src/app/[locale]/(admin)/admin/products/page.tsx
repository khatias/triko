import "server-only";

import { fetchAdminProductsList } from "./_queries/products";
import ProductsTable from "./_components/ProductsTable";
import ProductsFilters from "./_components/ProductsFilters";
import {
  coerceQ,
  coerceTab,
  coerceStr,
  coerceStock,
  coerceDiscount,
  coerceMissing,
  coerceSort,
  type ProductsFiltersState,
} from "./types/admin-products";
import { Section } from "@/components/UI/primitives";

type SearchParams = Record<string, string | string[] | undefined>;

function pickOne(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const sp = await searchParams;
  const { locale } = await params;

  const filters: ProductsFiltersState = {
    tab: coerceTab(pickOne(sp.tab)),
    q: coerceQ(pickOne(sp.q)),
    group: coerceStr(pickOne(sp.group)),
    stock: coerceStock(pickOne(sp.stock)),
    discount: coerceDiscount(pickOne(sp.discount)),
    missing: coerceMissing(pickOne(sp.missing)),
    sort: coerceSort(pickOne(sp.sort)),
  };

  const rows = await fetchAdminProductsList(locale);

  return (
    <Section className="min-h-screen py-10">
      <div className="space-y-6">
        <ProductsFilters rows={rows} locale={locale} filters={filters} />
        <ProductsTable rows={rows} locale={locale} filters={filters} />
      </div>
    </Section>
  );
}
