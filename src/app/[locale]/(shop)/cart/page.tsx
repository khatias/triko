import Image from "next/image";
import { getCartState, type CartItemRow } from "@/lib/cart/actions";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { normalizeLocale, isValidHttpUrl } from "@/utils/type-guards";
import Link from "next/link";
import CartItemRowClient from "@/components/cart/CartItemRowClient";
import { getTranslations } from "next-intl/server";
import CartAutoRefresh from "@/components/cart/CartAutoRefresh";

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
  const t = await getTranslations("Cart");

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20 pt-6 lg:pb-24 lg:pt-12">
      <CartAutoRefresh intervalMs={20000} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
          {t("cart")}{" "}
          <span className="text-lg font-medium text-zinc-400">
            ({state.cart.items_count})
          </span>
        </h1>

        {state.items.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start xl:gap-12">
            {/* --- Cart Items List --- */}
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {state.items.map((it) => {
                  const title = itemTitle(it, locale);
                  const img = extractImageUrl(it.image_url);
                  const href = it.parent_code
                    ? `/${locale}/products/${it.parent_code}`
                    : `/${locale}`;

                  return (
                    <div
                      key={it.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6"
                    >
                      {/* Image */}
                      <Link
                        href={href}
                        className="relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 sm:w-32"
                      >
                        {img ? (
                          <Image
                            src={img}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 100vw, 128px"
                            className="object-cover object-center hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex flex-1 flex-col justify-between gap-4">
                        {/* Title & Meta */}
                        <div>
                          <h3 className="text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
                            <Link
                              href={href}
                              className="hover:text-zinc-600 transition-colors"
                            >
                              {title}
                            </Link>
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500 font-medium">
                            {it.variant_size && (
                              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1">
                                Size: {it.variant_size}
                              </span>
                            )}
                            {it.variant_code && (
                              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1">
                                Ref: {it.variant_code}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls Component */}
                        <CartItemRowClient locale={locale} item={it} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- Checkout Card --- */}
            <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50">
                {/* Header */}
                <div className="bg-zinc-50/80 px-6 py-5 border-b border-zinc-100 backdrop-blur-sm">
                  <h2 className="text-lg font-bold text-zinc-900">
                    {t("orderSummary")}
                  </h2>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{t("products")}</span>
                      <span className="font-semibold text-zinc-900">
                        {state.cart.subtotal} ₾
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{t("deliveryFee")}</span>
                      <span className="font-semibold text-zinc-900">
                        {state.cart.shipping_total} ₾
                      </span>
                    </div>

                    {state.cart.discount_total &&
                      state.cart.discount_total !== "0.00" && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-emerald-600 font-medium">
                            {t("discount")}
                          </span>
                          <span className="font-bold text-emerald-600">
                            -{state.cart.discount_total} ₾
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="border-t border-dashed border-zinc-200"></div>

                  {/* Total */}
                  <div className="flex items-end justify-between">
                    <span className="text-base font-bold text-zinc-900 pb-1">
                      {t("total")}
                    </span>
                    <div className="text-right">
                      <span className="block text-3xl font-extrabold tracking-tight text-zinc-900">
                        {state.cart.total} ₾
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        Including VAT
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-zinc-900/10 transition-all hover:bg-black hover:scale-[1.01] active:scale-[0.99]">
                    {t("checkout")}{" "}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    {t("secure")}
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

async function EmptyState({ locale }: { locale: "en" | "ka" }) {
  const t = await getTranslations("Cart");
  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 shadow-inner ring-1 ring-zinc-100">
        <ShoppingBag className="h-8 w-8 text-zinc-300" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-2"> {t("empty")} </h3>

      <Link
        href={`/${locale}/products`}
        className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:bg-zinc-800 hover:scale-105"
      >
        {t("continueShopping")}
      </Link>
    </div>
  );
}
