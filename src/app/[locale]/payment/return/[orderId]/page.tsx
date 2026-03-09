import { notFound } from "next/navigation";
import PaymentReturnClient from "../PaymentReturnClient";

interface PageProps {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale, orderId } = await params;
  const { token } = await searchParams;
  if (!orderId?.trim()) notFound();

  return (
    <PaymentReturnClient
      locale={locale}
      orderId={orderId}
      token={token ?? null}
    />
  );
}
