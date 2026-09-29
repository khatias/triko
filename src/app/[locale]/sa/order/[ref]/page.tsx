import type { Metadata } from "next";

import CustomerOrder from "./_components/CustomerOrder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Your order | TRIKO",
  // The URL contains the order's secret token: never index it, and never
  // send it to other sites in the Referer header.
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function CustomerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { ref } = await params;
  const { t } = await searchParams;

  return (
    <CustomerOrder
      orderRef={decodeURIComponent(ref ?? "").toUpperCase()}
      token={typeof t === "string" ? t : ""}
    />
  );
}
