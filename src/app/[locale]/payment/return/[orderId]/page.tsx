import PaymentReturnClient from "../PaymentReturnClient";

interface PageProps {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale, orderId } = await params;
  const { token } = await searchParams;

  return (
    <PaymentReturnClient 
      locale={locale} 
      orderId={orderId} 
      token={token ?? null} 
    />
  );
}