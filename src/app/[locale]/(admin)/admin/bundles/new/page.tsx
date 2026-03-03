import "server-only";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import BundleCreateClient from "./_components/BundleCreateClient";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <BundleCreateClient locale={locale} />;
}