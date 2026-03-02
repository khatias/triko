import "server-only";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Section } from "@/components/UI/primitives";
import { fetchAdminProductsList } from "./_queries/products";
import AdminProductsClient from "./_components/AdminProductsClient";

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

  const rows = await fetchAdminProductsList(locale);

  const initial = {
    tab: pickOne(sp.tab),
    q: pickOne(sp.q),
    group: pickOne(sp.group),
    stock: pickOne(sp.stock),
    missing: pickOne(sp.missing),
    sort: pickOne(sp.sort),
  };

  return (
    <Section className="min-h-screen py-10">
      <AdminProductsClient rows={rows} locale={locale} initial={initial} />
    </Section>
  );
}