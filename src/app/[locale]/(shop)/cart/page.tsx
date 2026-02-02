import Image from "next/image";
import { getCartState, type CartItemRow } from "@/lib/cart/actions";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { normalizeLocale, isValidHttpUrl } from "@/utils/type-guards";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function itemTitle(it: CartItemRow, locale: "en" | "ka") {
  const ka = it.title_ka?.trim() || "";
  const en = it.title_en?.trim() || "";
  const base = it.product_name?.trim() || "Product";
  return locale === "ka" ? ka || en || base : en || ka || base;
}

export default async function CartPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const state = await getCartState();

  return (
    <div className="min-h-[80vh] bg-white px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
          Shopping Cart
        </h1>

        {state.items.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="divide-y divide-zinc-100 border-b border-t border-zinc-100">
                {state.items.map((it) => {
                  const title = itemTitle(it, locale);

                  return (
                    <div key={it.id} className="flex gap-6 py-6 sm:gap-8">
                      <div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                        {it.image_url && isValidHttpUrl(it.image_url) ? (
                          <Image
                            src={it.image_url}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 96px, 128px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400">
                            <ShoppingBag className="h-6 w-6 opacity-20" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-start">
                        <div className="space-y-1 pr-4">
                          <h3 className="text-base font-medium text-zinc-900">
                            {title}
                          </h3>

                          <div className="flex flex-col text-sm text-zinc-500">
                            {it.variant_size ? (
                              <span>Size: {it.variant_size}</span>
                            ) : null}
                          </div>

                          <p className="pt-2 text-sm font-semibold text-zinc-900">
                            {it.price_at_add} GEL
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-6 lg:col-span-5 lg:sticky lg:top-8 xl:col-span-4">
              <h2 className="text-lg font-medium text-zinc-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <span className="text-sm text-zinc-600">
                    Items ({state.cart.items_count})
                  </span>
                  <span className="text-sm font-medium text-zinc-900">
                    {state.cart.subtotal} GEL
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-semibold text-zinc-900">
                    Total
                  </span>
                  <span className="text-xl font-bold text-zinc-900">
                    {state.cart.total} GEL
                  </span>
                </div>

                <p className="text-xs text-zinc-500">
                  Shipping and taxes calculated at checkout.
                </p>

                <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-base font-medium text-white shadow-lg shadow-zinc-900/10 transition-transform active:scale-[0.98] hover:bg-zinc-800">
                  Checkout <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: "en" | "ka" }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-900/5">
        <ShoppingBag className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-zinc-900">
        Your cart is empty
      </h3>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">
        Add something you love and it will show up here.
      </p>
      <Link
        href={`/${locale}`}
        className="mt-8 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
