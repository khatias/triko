import "server-only"
import { fetchAdminProductsList } from "./_queries/products"
import ProductsTable from "./_components/ProductsTable"
import ProductsFilters from "./_components/ProductsFilters"
import {
  coerceQ,
  coerceTab,
  coerceStr,
  coerceStock,
  coerceDiscount,
  coerceMissing,
  coerceSort,
  type ProductsFiltersState,
} from "./types/admin-products"
import { Section } from "@/components/UI/primitives"
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{ locale: string }>
}) {
  const sp = await searchParams
  const { locale } = await params

  const tab = coerceTab(Array.isArray(sp.tab) ? sp.tab[0] : sp.tab)
  const q = coerceQ(Array.isArray(sp.q) ? sp.q[0] : sp.q)

  const filters: ProductsFiltersState = {
    tab,
    q,
    group: coerceStr(Array.isArray(sp.group) ? sp.group[0] : sp.group),
    stock: coerceStock(Array.isArray(sp.stock) ? sp.stock[0] : sp.stock),
    discount: coerceDiscount(Array.isArray(sp.discount) ? sp.discount[0] : sp.discount),
    missing: coerceMissing(Array.isArray(sp.missing) ? sp.missing[0] : sp.missing),
    sort: coerceSort(Array.isArray(sp.sort) ? sp.sort[0] : sp.sort),
  }

  const rows = await fetchAdminProductsList(locale)

  return (
    <Section className="min-h-screen py-10">
      <div className="">
        <ProductsFilters rows={rows} locale={locale} filters={filters} />
        <ProductsTable rows={rows} locale={locale} filters={filters} />
      </div> 
    </Section>
  )
}
