import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Order created</h1>
      <p className="mt-2 text-sm opacity-70">Order ID: {orderId}</p>

      <div className="mt-6 space-y-3">
        <button className="w-full rounded-xl border px-4 py-2" disabled>
          Continue to payment (next step)
        </button>

        <Link
          className="block text-sm underline"
          href={`/${locale}/profile/orders`}
        >
          View all my orders
        </Link>

        <Link className="block text-sm underline" href={`/${locale}/cart`}>
          Back to cart
        </Link>
      </div>
    </div>
  );
}
