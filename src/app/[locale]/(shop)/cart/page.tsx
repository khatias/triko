// src/app/[locale]/cart/page.tsx
import Image from "next/image";
import { getCartState, type CartItemRow } from "@/lib/cart/actions";
import { ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { normalizeLocale, isValidHttpUrl } from "@/utils/type-guards";
import Link from "next/link";
import CartItemRowClient from "@/components/cart/CartItemRowClient";
import CartBundleRowClient from "@/components/cart/CartBundleRowClient";
import { getTranslations } from "next-intl/server";
import CartAutoRefresh from "@/components/cart/CartAutoRefresh";
import EmptyState from "@/components/UI/EmptyState";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function itemTitle(it: CartItemRow, locale: "en" | "ka") {
  const ka = it.title_ka?.trim() || "";
  const en = it.title_en?.trim() || "";
  const base = it.product_name?.trim() || "Product";

  return locale === "ka" ? ka || en || base : en || ka || base;
}

function cleanBundleCode(code: string) {
  const trimmed = code.trim();

  /*
    Examples:
    X303-0001L  -> X303-0001
    X303-0003L  -> X303-0003
    X301-0001   -> X301-0001
  */
  const match = trimmed.match(/^(.+-\d+)[A-Za-z]+$/);

  if (match?.[1]) {
    return match[1];
  }

  return trimmed;
}

function safePathPart(v: string) {
  return v.trim().replaceAll("/", "-");
}

function extractImageUrl(v: string | null): string | null {
  if (!v) return null;

  const trimmed = v.trim();
  if (!trimmed) return null;

  if (isValidHttpUrl(trimmed)) return trimmed;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const rec = parsed as Record<string, unknown>;
        const u = rec.url;

        if (typeof u === "string" && isValidHttpUrl(u)) return u;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0] as unknown;

        if (typeof first === "string" && isValidHttpUrl(first)) return first;

        if (typeof first === "object" && first !== null) {
          const rec = first as Record<string, unknown>;
          const u = rec.url;

          if (typeof u === "string" && isValidHttpUrl(u)) return u;
        }
      }
    } catch {}
  }

  return null;
}

type CartLine =
  | { kind: "single"; key: string; items: [CartItemRow] }
  | { kind: "bundle"; key: string; items: CartItemRow[] };

function groupCartItems(items: CartItemRow[]): CartLine[] {
  const bundleMap = new Map<string, CartItemRow[]>();
  const singles: CartLine[] = [];

  for (const it of items) {
    const k = it.bundle_key ?? null;

    if (k) {
      const arr = bundleMap.get(k) ?? [];
      arr.push(it);
      bundleMap.set(k, arr);
    } else {
      singles.push({ kind: "single", key: it.id, items: [it] });
    }
  }

  const bundles: CartLine[] = Array.from(bundleMap.entries()).map(
    ([key, arr]) => {
      const sorted = [...arr].sort((a, b) =>
        String(a.variant_code ?? "").localeCompare(String(b.variant_code ?? "")),
      );

      return { kind: "bundle", key, items: sorted };
    },
  );

  return [...bundles, ...singles];
}

function bundleTitle(items: CartItemRow[], locale: "en" | "ka") {
  const preferred =
    items.find((x) =>
      locale === "ka"
        ? Boolean(x.title_ka?.trim() || x.title_en?.trim())
        : Boolean(x.title_en?.trim() || x.title_ka?.trim()),
    ) ?? items[0];

  return preferred
    ? itemTitle(preferred, locale)
    : locale === "ka"
      ? "ორეული"
      : "Set";
}

function bundleHref(items: CartItemRow[], locale: "en" | "ka") {
  const codes = items
    .map((x) => x.variant_code?.trim())
    .filter((x): x is string => Boolean(x))
    .map(cleanBundleCode)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (codes.length > 0) {
    return `/${locale}/products/BNDL:${codes.map(safePathPart).join("+")}`;
  }

  const pc = items.find((x) => x.parent_code)?.parent_code?.trim() ?? null;

  return pc ? `/${locale}/products/${safePathPart(pc)}` : `/${locale}/products`;
}

function bundleImage(items: CartItemRow[]) {
  for (const it of items) {
    const u = extractImageUrl(it.image_url);
    if (u) return u;
  }

  return null;
}

export default async function CartPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const state = await getCartState();
  const t = await getTranslations("Cart");

  const lines = groupCartItems(state.items);

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
          <EmptyState
            title={t("empty")}
            primaryAction={{
              label: t("continueShopping"),
              href: `/${locale}/products`,
            }}
            icon={<ShoppingBag className="h-8 w-8" />}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start xl:gap-12">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {lines.map((line) => {
                  if (line.kind === "single") {
                    const it = line.items[0];
                    const title = itemTitle(it, locale);
                    const img = extractImageUrl(it.image_url);

                    const href = it.parent_code
                      ? `/${locale}/products/${safePathPart(it.parent_code)}`
                      : `/${locale}/products`;

                    return (
                      <div
                        key={line.key}
                        className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6"
                      >
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
                              className="object-cover object-center transition-transform duration-500 hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-zinc-300">
                              <ShoppingBag className="h-8 w-8" />
                            </div>
                          )}
                        </Link>

                        <div className="flex flex-1 flex-col justify-between gap-4">
                          <div>
                            <h3 className="text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
                              <Link
                                href={href}
                                className="transition-colors hover:text-zinc-600"
                              >
                                {title}
                              </Link>
                            </h3>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
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

                          <CartItemRowClient locale={locale} item={it} />
                        </div>
                      </div>
                    );
                  }

                  const items = line.items;
                  const title = bundleTitle(items, locale);
                  const img = bundleImage(items);
                  const href = bundleHref(items, locale);

                  const metaParts = items
                    .map((x) => {
                      const size = x.variant_size ? `Size ${x.variant_size}` : "";
                      const ref = x.variant_code ? `Ref ${x.variant_code}` : "";

                      return [size, ref].filter(Boolean).join(" ");
                    })
                    .filter(Boolean);

                  return (
                    <div
                      key={line.key}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6 sm:p-6"
                    >
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
                            className="object-cover object-center transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-zinc-300">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold leading-snug text-zinc-900 sm:text-lg">
                            <Link
                              href={href}
                              className="transition-colors hover:text-zinc-600"
                            >
                              {title}
                            </Link>
                          </h3>

                          {metaParts.length ? (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
                              {metaParts.map((m, idx) => (
                                <span
                                  key={`${line.key}:${idx}`}
                                  className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-1"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <CartBundleRowClient locale={locale} items={items} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:sticky lg:top-8 lg:col-span-5 xl:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-200/50">
                <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-5 backdrop-blur-sm">
                  <h2 className="text-lg font-bold text-zinc-900">
                    {t("orderSummary")}
                  </h2>
                </div>

                <div className="space-y-5 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">{t("products")}</span>

                      <span className="font-semibold text-zinc-900">
                        {state.cart.subtotal} ₾
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <span className="text-sm text-zinc-600">
                        {t("deliveryFee")}
                      </span>

                      <span className="max-w-[70%] text-right text-xs leading-5 text-slate-500">
                        {state.cart.shipping_total === "0.00"
                          ? t("shippingPriceText")
                          : `${state.cart.shipping_total} ₾`}{" "}
                      </span>
                    </div>

                    {state.cart.discount_total &&
                      state.cart.discount_total !== "0.00" && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-emerald-600">
                            {t("discount")}
                          </span>

                          <span className="font-bold text-emerald-600">
                            -{state.cart.discount_total} ₾
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="border-t border-dashed border-zinc-200" />

                  <div className="flex items-end justify-between">
                    <span className="pb-1 text-base font-bold text-zinc-900">
                      {t("total")}
                    </span>

                    <div className="text-right">
                      <span className="block text-3xl font-extrabold tracking-tight text-zinc-900">
                        {state.cart.total} ₾
                      </span>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Including VAT
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/checkout`}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-zinc-900/10 transition-all hover:scale-[1.01] hover:bg-black active:scale-[0.99]"
                  >
                    {t("checkout")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

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