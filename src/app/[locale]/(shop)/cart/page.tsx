import Image from "next/image";
import { getCartState, type CartItemRow } from "@/lib/cart/actions";
import { ShoppingBag, ArrowRight, Lock, CreditCard } from "lucide-react";
import { normalizeLocale, isValidHttpUrl } from "@/utils/type-guards";
import Link from "next/link";
import CartItemRowClient from "@/components/cart/CartItemRowClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function itemTitle(it: CartItemRow, locale: "en" | "ka") {
  const ka = it.title_ka?.trim() || "";
  const en = it.title_en?.trim() || "";
  const base = it.product_name?.trim() || "Product";
  return locale === "ka" ? ka || en || base : en || ka || base;
}

function extractImageUrl(v: string | null): string | null {
  if (!v) return null;
  if (isValidHttpUrl(v)) return v;
  const trimmed = v.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const obj = JSON.parse(trimmed) as unknown;
    if (typeof obj === "object" && obj !== null) {
      const rec = obj as Record<string, unknown>;
      const u = rec.url;
      if (typeof u === "string" && isValidHttpUrl(u)) return u;
    }
  } catch {}
  return null;
}

export default async function CartPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const state = await getCartState();

  return (
    <div className="min-h-screen bg-white pb-20 pt-6 lg:bg-zinc-50/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 lg:text-3xl">
          Shopping Bag <span className="text-zinc-400 font-medium text-lg">({state.cart.items_count})</span>
        </h1>

        {state.items.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            
            {/* --- Cart Items List (Compact) --- */}
            <div className="lg:col-span-7 xl:col-span-8 bg-white lg:rounded-2xl lg:p-6 lg:shadow-sm lg:border lg:border-zinc-100">
              <div className="divide-y divide-zinc-100">
                {state.items.map((it) => {
                  const title = itemTitle(it, locale);
                  const img = extractImageUrl(it.image_url);
                  const href = it.parent_code
                    ? `/${locale}/products/${it.parent_code}`
                    : `/${locale}`;

                  return (
                    // Reduced padding (py-4) for compact height
                    <div key={it.id} className="flex gap-4 py-4 sm:gap-6">
                      
                      {/* Image: Compact fixed size */}
                      <Link
                        href={href}
                        className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md border border-zinc-100 bg-zinc-50 sm:h-28 sm:w-24"
                      >
                        {img ? (
                          <Image
                            src={img}
                            alt={title}
                            fill
                            sizes="96px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-300">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between py-0.5">
                        {/* Title & Meta */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                             <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug sm:text-base">
                                <Link href={href} className="hover:underline">
                                  {title}
                                </Link>
                             </h3>
                             <p className="shrink-0 text-sm font-bold text-zinc-900 sm:text-base">
                               {it.price_at_add} ₾
                             </p>
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                            {it.variant_size && <span>Size: {it.variant_size}</span>}
                            {it.variant_code && <span className="text-zinc-400">|</span>}
                            {it.variant_code && <span>Ref: {it.variant_code}</span>}
                          </div>
                        </div>

                        {/* Controls */}
                        <CartItemRowClient locale={locale} item={it} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- Beautiful Checkout Card --- */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-zinc-100">
                
                {/* Header */}
                <div className="bg-zinc-50/50 px-6 py-4 border-b border-zinc-100">
                  <h2 className="text-lg font-bold text-zinc-900">Order Summary</h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-medium text-zinc-900">{state.cart.subtotal} ₾</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-zinc-600">Shipping</span>
                     <span className="text-zinc-400 italic">Calculated at checkout</span>
                  </div>

                  {/* Divider */}
                  <div className="my-2 border-t border-dashed border-zinc-200"></div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-base font-bold text-zinc-900">Total</span>
                    <div className="text-right">
                       <span className="block text-2xl font-bold text-zinc-900">{state.cart.total} ₾</span>
                       <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Including VAT</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-4 text-sm font-bold text-white shadow-lg shadow-zinc-900/10 transition-all hover:bg-black hover:scale-[1.01] active:scale-[0.98]">
                    Checkout Securely <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  {/* Trust Badges */}
                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5">
                       <Lock className="h-3 w-3" /> Secure
                    </div>
                    <div className="h-3 w-[1px] bg-zinc-200"></div>
                    <div className="flex items-center gap-1.5">
                       <CreditCard className="h-3 w-3" /> Encrypted
                    </div>
                  </div>
                </div>
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
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-900/5">
        <ShoppingBag className="h-8 w-8 text-zinc-300" />
      </div>
      <h3 className="text-lg font-medium text-zinc-900">Your cart is empty</h3>
      <Link
        href={`/${locale}`}
        className="mt-6 rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
      >
        Continue Shopping
      </Link>
    </div>
  );
}