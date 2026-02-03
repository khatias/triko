import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function encNext(path: string) {
  return encodeURIComponent(path);
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (!user) {
    redirect(`/${locale}/login?next=${encNext(`/${locale}/checkout`)}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>

        <Link className="text-sm underline" href={`/${locale}/cart`}>
          Back to cart
        </Link>
      </div>

      <div className="grid gap-6">
        <section className="rounded-2xl border p-4">
          <h2 className="text-lg font-medium">Contact and delivery</h2>

          <form className="mt-4 space-y-3">
            <div>
              <label className="block text-sm">Full name</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                name="full_name"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm">Phone</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                name="phone"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-sm">Address</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                name="address"
                autoComplete="street-address"
              />
            </div>

            <button
              type="button"
              className="mt-2 w-full rounded-xl border px-4 py-2"
              disabled
            >
              Pay
            </button>

            <p className="text-xs opacity-70">
              Next step: I’ll connect this button to “Create pending order”, then
              redirect to Bank of Georgia hosted payment.
            </p>
          </form>
        </section>

        <section className="rounded-2xl border p-4">
          <h2 className="text-lg font-medium">Order summary</h2>
          <p className="mt-2 text-sm opacity-70">
            Summary will appear here in the next step (after I map  real CartState fields).
          </p>
        </section>
      </div>
    </div>
  );
}
