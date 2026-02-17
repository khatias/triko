import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTranslations } from "next-intl/server";
import type { TranslationValues } from "next-intl";
import {
  Package,
  CalendarDays,
  ShoppingBag,
  AlertTriangle,
  Truck,
  MapPin,
  Box,
  Clock,
  CheckCircle2,
  CreditCard,
  Receipt,
} from "lucide-react";

import { formatDate, formatPrice } from "@/lib/helpers";
import { CopyId } from "@/components/UI/CopyButton";
import { toNumber, isPaidStatus } from "@/utils/type-guards";

export const dynamic = "force-dynamic";

// --- TYPES ---
export type ShippingStatus =
  | "not_started"
  | "confirmed"
  | "in_transit"
  | "delivered";

type OrderRow = {
  id: string;
  status: string;
  shipping_status: ShippingStatus | string | null;
  items_count: number | null;
  subtotal: number | string | null;
  discount_total: number | string | null;
  shipping_total: number | string | null;
  total: number | string | null;
  created_at: string;
  currency: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  fina_id: number | null;
  code: string | null;
  name_ka: string | null;
  name_en: string | null;
  product_name: string | null;
  image_url: string | null;
  variant_name: string | null;

  quantity: number | null;
  currency: string | null;

  unit_price: number | string | null;
  unit_list_price: number | string | null;
  line_total: number | string | null;

  created_at: string;
};

// --- HELPERS ---
function isShippingStatus(v: unknown): v is ShippingStatus {
  return v === "confirmed" || v === "in_transit" || v === "delivered";
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeNum(v: number | string | null | undefined, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return toNumber(v);
  return fallback;
}

function safeStr(v: string | null | undefined): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

// --- UI COMPONENTS ---
function SectionCard({
  title,
  right,
  children,
  className,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("overflow-hidden rounded-2xl bg-white", className)}>
      {(title || right) && (
        <>
          <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
            {title ? (
              <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            ) : (
              <div />
            )}
            {right}
          </header>
          <div className="h-px bg-gray-100" />
        </>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ShippingMiniTracker({
  status,
  t,
}: {
  status: ShippingStatus;
  t: (key: string, values?: TranslationValues) => string;
}) {
  const steps: Array<{ key: ShippingStatus; label: string; icon: typeof Box }> =
    [
      { key: "confirmed", icon: Box, label: t("shipping.confirmedShort") },
      { key: "in_transit", icon: Truck, label: t("shipping.inTransitShort") },
      { key: "delivered", icon: MapPin, label: t("shipping.deliveredShort") },
    ];

  const idx = Math.max(
    0,
    steps.findIndex((s) => s.key === status),
  );

  const header =
    status === "confirmed"
      ? {
          label: t("shipping.confirmedLabel"),
          desc: t("shipping.confirmedDesc"),
          Icon: Box,
        }
      : status === "in_transit"
        ? {
            label: t("shipping.inTransitLabel"),
            desc: t("shipping.inTransitDesc"),
            Icon: Truck,
          }
        : {
            label: t("shipping.deliveredLabel"),
            desc: t("shipping.deliveredDesc"),
            Icon: CheckCircle2,
          };

  return (
    <section className="overflow-hidden  bg-white border-b border-gray-300 ">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#172a3e] text-white">
            <header.Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{header.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {header.desc}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      <div className="bg-gray-50/60 px-5 py-6 sm:px-8">
        <div className="relative">
          <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-200" />
          <div
            className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#172a3e] transition-all duration-700 ease-out"
            style={{ width: `${(idx / (steps.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {steps.map((s, i) => {
              const active = i <= idx;
              const Icon = s.icon;

              return (
                <div key={s.key} className="flex flex-col items-center gap-2">
                  <div
                    className={cx(
                      "z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                      active
                        ? "border-[#172a3e] bg-[#172a3e] text-white"
                        : "border-gray-300 bg-white text-gray-400",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <span
                    className={cx(
                      "text-[10px] font-bold uppercase tracking-wider",
                      active ? "text-gray-900" : "text-gray-400",
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- PAGE ---
export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;
  const orderIdStr = String(orderId);

  const supabase = await createClient();
  const t = await getTranslations("Profile.orders");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-gray-900">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {t("logintoView")}
          </h2>
          <Link
            href={`/${locale}/login`}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-bold text-white active:scale-[0.99]"
          >
            {t("loginCta")}
          </Link>
        </div>
      </div>
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id,status,shipping_status,items_count,subtotal,discount_total,shipping_total,total,created_at,currency",
    )
    .eq("id", orderIdStr)
    .eq("user_id", user.id)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
          <h1 className="text-lg font-bold">{t("failedToLoad")}</h1>
          <p className="mt-1 text-sm opacity-80">{orderError.message}</p>
        </div>
      </div>
    );
  }

  if (!order) notFound();

  const { data: itemsRaw, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "id,order_id,fina_id,code,name_ka,name_en,product_name,image_url,variant_name,quantity,currency,unit_price,unit_list_price,line_total,created_at",
    )
    .eq("order_id", orderIdStr)
    .returns<OrderItemRow[]>();

  const currency = order.currency ?? "GEL";
  const subtotal = safeNum(order.subtotal, 0);
  const discountTotal = safeNum(order.discount_total, 0);
  const shippingTotal = safeNum(order.shipping_total, 0);
  const total = safeNum(order.total, 0);

  const paid = isPaidStatus(order.status);
  const shippingStatus: ShippingStatus | null =
    paid && isShippingStatus(order.shipping_status)
      ? order.shipping_status
      : null;

  const items: OrderItemRow[] = itemsRaw ?? [];
  const payHref = `/${locale}/checkout?orderId=${encodeURIComponent(orderIdStr)}`;

  const SummaryContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">{t("subtotalLabel")}</span>
        <span className="font-bold text-gray-900">
          {formatPrice(subtotal, currency)}
        </span>
      </div>

      {discountTotal > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-emerald-700">
            {t("discountLabel")}
          </span>
          <span className="font-bold text-emerald-700">
            -{formatPrice(discountTotal, currency)}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-600">{t("shippingLabel")}</span>
        {shippingTotal > 0 ? (
          <span className="font-bold text-gray-900">
            {formatPrice(shippingTotal, currency)}
          </span>
        ) : (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            {t("freeLabel")}
          </span>
        )}
      </div>

      <div className="border-t border-dashed border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold text-gray-900">
            {t("totalLabel")}
          </span>
          <span className="text-2xl font-extrabold text-gray-900">
            {formatPrice(total, currency)}
          </span>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href={`/${locale}/cart`}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition-colors hover:border-gray-300"
        >
          <Receipt className="h-4 w-4 text-gray-500 transition-colors group-hover:text-gray-700" />
          {t("returnToCart")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className=" bg-slate-50/70 rounded-2xl  pb-20">
      <main className="mx-auto w-full  px-4 ">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700">
                <CalendarDays className="h-4 w-4 text-gray-500" />
                {formatDate(order.created_at)}
              </span>
              <div className="hidden h-4 w-px bg-gray-300 sm:block" />
              <CopyId id={order.id} />
            </div>
          </div>

          {!paid && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={payHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-bold text-white active:scale-[0.99]"
              >
                <CreditCard className="h-4 w-4" />
                {t("completePayment")}
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-8">
            {shippingStatus && (
              <ShippingMiniTracker status={shippingStatus} t={t} />
            )}

            {!paid && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-amber-900">
                        {t("awaitingPaymentTitle")}
                      </p>
                      <p className="mt-1 max-w-md text-sm text-amber-900/80">
                        {t("awaitingPaymentDesc")}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={payHref}
                    className="whitespace-nowrap rounded-lg bg-amber-700 px-5 py-2.5 text-sm font-bold text-white active:scale-[0.99]"
                  >
                    {t("payNow")}
                  </Link>
                </div>
              </div>
            )}

            <SectionCard
              title={t("itemsTitle")}
              right={
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-700">
                  {t("itemsCount", {
                    count: order.items_count ?? items.length,
                  })}
                </span>
              }
            >
              {itemsError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-800">
                  {t("failedToLoadItems")}
                </div>
              )}

              {items.length === 0 && !itemsError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <ShoppingBag
                    className="mb-4 h-12 w-12 opacity-30"
                    strokeWidth={1}
                  />
                  <p className="font-medium">{t("noItems")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {items.map((it) => {
                    const title =
                      locale === "ka"
                        ? (safeStr(it.name_ka) ??
                          safeStr(it.product_name) ??
                          t("productAlt"))
                        : (safeStr(it.name_en) ??
                          safeStr(it.product_name) ??
                          t("productAlt"));

                    const qty = safeNum(it.quantity, 1);
                    const unitPrice = safeNum(it.unit_price, 0);
                    const unitListPrice = safeNum(it.unit_list_price, 0);
                    const lineTotal = safeNum(it.line_total, unitPrice * qty);

                    const code = safeStr(it.code);
                    const variant = safeStr(it.variant_name);

                    return (
                      <li key={it.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex gap-4 sm:gap-6">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-24 sm:w-24">
                            {it.image_url ? (
                              <Image
                                src={it.image_url}
                                alt={title}
                                fill
                                sizes="96px"
                                className="object-contain p-1"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-gray-300">
                                <Package className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="line-clamp-2 text-sm font-bold text-gray-900 sm:text-base">
                                  {title}
                                </h3>
                                <p className="hidden shrink-0 text-right text-sm font-extrabold text-gray-900 sm:block">
                                  {formatPrice(lineTotal, currency)}
                                </p>
                              </div>

                              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                                {variant && (
                                  <span className="font-medium text-gray-600">
                                    {t("variantLabel")}:{" "}
                                    <span className="text-gray-900">
                                      {variant}
                                    </span>
                                  </span>
                                )}
                                {code && (
                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">
                                    {code}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-800">
                                  {qty} × {formatPrice(unitPrice, currency)}
                                </span>
                                {unitListPrice > 0 &&
                                  unitListPrice > unitPrice && (
                                    <span className="text-xs font-medium text-gray-400 line-through">
                                      {formatPrice(unitListPrice, currency)}
                                    </span>
                                  )}
                              </div>

                              <p className="block text-sm font-extrabold text-gray-900 sm:hidden">
                                {formatPrice(lineTotal, currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            <div className="lg:hidden">
              <SectionCard title={t("summaryTitle")}>
                <SummaryContent />
              </SectionCard>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <SectionCard title={t("summaryTitle")}>
                <SummaryContent />
              </SectionCard>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
