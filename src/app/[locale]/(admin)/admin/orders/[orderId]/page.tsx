import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, ShieldCheck, User } from "lucide-react";

import { formatDate, formatPrice, cn } from "@/lib/helpers";
import { fetchOrderData } from "../_queries/fetchData";
import ShippingStatusSelect from "../_components/ShippingStatusSelect";
import { CopyId } from "@/components/UI/CopyButton";
import { CopyText } from "@/components/UI/CopyText";
import {
  StatusBadge,
  type ShippingStatus,
} from "@/components/UI/ShippingStatus";
import {
  PaymentStatus,
  type PaymentStatusType,
} from "@/components/UI/PaymentStatus";
import { getTranslations } from "next-intl/server";

// --- TYPES ---
type PageProps = {
  params: Promise<{ locale: string; orderId: string }>;
};

type Order = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;

  status: PaymentStatusType;
  shipping_status: ShippingStatus | null;

  currency: string | null;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;

  paid_at: string | null;

  shipping_full_name: string | null;
  shipping_phone: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_region: string | null;

  fina_doc_id: number | null;
  bog_status: string | null;
  bog_order_id: string | null;
  bog_payment_id: string | null;

  items_count: number;
};

type OrderItem = {
  id: string;
  fina_id: number;
  code: string | null;
  product_name: string | null;
  name_en: string | null;
  name_ka: string | null;
  variant_name: string | null;
  quantity: number;
  currency: string | null;
  unit_price: number;
  line_total: number;
};

type Payment = {
  provider: string;
  status: string;
  amount: number;
  currency: string | null;
  created_at: string;
  provider_payment_id: string | null;
  provider_order_id: string | null;
};

// --- HELPERS ---
function itemName(it: OrderItem) {
  return (
    it.product_name ||
    it.name_en ||
    it.name_ka ||
    (it.code ? `SKU ${it.code}` : null) ||
    `FINA #${it.fina_id}`
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <div className="border-b border-zinc-100 bg-zinc-50/50 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function KeyValue({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span
        className={cn(
          "max-w-44 truncate text-right font-medium text-zinc-900 dark:text-zinc-100 sm:max-w-[16rem]",
          mono && "font-mono text-xs",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { locale, orderId } = await params;
  const t = await getTranslations("Admin.Orders");

  const { order, items, payment } = (await fetchOrderData(locale, orderId)) as {
    order: Order | null;
    items: OrderItem[];
    payment: Payment | null;
  };

  if (!order) notFound();

  const addr3 = order.shipping_city
    ? `${order.shipping_city}${order.shipping_region ? `, ${order.shipping_region}` : ""}`
    : "";

  const addressLines = [
    order.shipping_line1,
    order.shipping_line2,
    addr3,
  ].filter((v): v is string => Boolean(v && v.trim()));

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-zinc-900/80 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <Link
              href={`/${locale}/admin/orders`}
              prefetch
              className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                  {t("title")}
                </h1>
                <span className="hidden text-zinc-300 dark:text-zinc-700 sm:inline">
                  •
                </span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {formatDate(order.created_at)}
                </span>
              </div>

              <div className="hidden font-mono text-[11px] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300 sm:block sm:text-xs">
                <span className="select-all break-all">{order.id}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <PaymentStatus label={order.status} />
            <StatusBadge order={order} status={order.shipping_status} />
          </div>
        </div>
      </div>

      {/* --- MAIN LAYOUT --- */}
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 lg:px-8">
        {/* --- LEFT COLUMN --- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:px-6">
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {t("content")}
              </h3>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {items.length} {t("items")}
              </span>
            </div>

            {/* Mobile item cards */}
            <div className="p-4 space-y-3 md:hidden">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {itemName(it)}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                        {it.code ? (
                          <span className="inline-flex items-center gap-2">
                            SKU <CopyText value={it.code} />
                          </span>
                        ) : null}

                        {Number.isFinite(it.fina_id) ? (
                          <span className="inline-flex items-center gap-2">
                            FINA <CopyText value={String(it.fina_id)} />
                          </span>
                        ) : null}

                        {it.variant_name ? (
                          <span className="text-zinc-400">
                            ({it.variant_name})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs text-zinc-500">
                        {t("quantity")}
                      </div>
                      <div className="font-medium">{it.quantity}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                      <div className="text-zinc-500">{t("price")}</div>
                      <div className="font-mono text-zinc-800 dark:text-zinc-200">
                        {formatPrice(Number(it.unit_price), it.currency)}
                      </div>
                    </div>

                    <div className="rounded-md bg-zinc-50 p-2 dark:bg-zinc-900">
                      <div className="text-zinc-500">{t("total")}</div>
                      <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatPrice(Number(it.line_total), it.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3">{t("itemDetails")}</th>
                    <th className="px-6 py-3 text-right">{t("price")}</th>
                    <th className="px-6 py-3 text-right">{t("quantity")}</th>
                    <th className="px-6 py-3 text-right">{t("total")}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-6 py-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {itemName(it)}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
                          {it.code ? (
                            <span className="flex items-center gap-2">
                              SKU: <CopyText value={it.code} />
                            </span>
                          ) : null}

                          {Number.isFinite(it.fina_id) ? (
                            <span className="flex items-center gap-2">
                              FINA: <CopyText value={String(it.fina_id)} />
                            </span>
                          ) : null}

                          {it.variant_name ? (
                            <span className="text-zinc-400">
                              ({it.variant_name})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-6 py-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        {formatPrice(Number(it.unit_price), it.currency)}
                      </td>

                      <td className="px-6 py-3 text-right font-medium">
                        {it.quantity}
                      </td>

                      <td className="px-6 py-3 text-right font-mono font-semibold text-zinc-900 dark:text-white">
                        {formatPrice(Number(it.line_total), it.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-6">
              <div className="ml-auto flex w-full max-w-70 flex-col gap-2">
                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>{t("subtotal")}</span>
                  <span>
                    {formatPrice(Number(order.subtotal), order.currency)}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>{t("shipping")}</span>
                  <span>
                    {formatPrice(Number(order.shipping_total), order.currency)}
                  </span>
                </div>

                {order.discount_total > 0 ? (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>{t("discount")}</span>
                    <span>
                      -
                      {formatPrice(
                        Number(order.discount_total),
                        order.currency,
                      )}
                    </span>
                  </div>
                ) : null}

                <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-white">
                  <span>{t("total")}</span>
                  <span>
                    {formatPrice(Number(order.total), order.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical + Gateway */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel title={t("technicalData")}>
              <KeyValue
                label={t("orderId")}
                value={<CopyId id={order.id} />}
                mono
              />

              <KeyValue
                label={t("userId")}
                value={order.user_id ? <CopyId id={order.user_id} /> : "—"}
                mono
              />

              <div className="mt-2 flex items-center justify-between rounded bg-zinc-50 px-2 py-1.5 text-xs dark:bg-zinc-800">
                <span className="text-zinc-500">{t("syncStatus")}</span>
                {order.fina_doc_id ? (
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <ShieldCheck className="h-3 w-3" /> FINA {order.fina_doc_id}
                  </span>
                ) : (
                  <span className="text-zinc-400">{t("notSynced")}</span>
                )}
              </div>
            </Panel>

            <Panel title={t("gatewayData")}>
              <KeyValue
                label="BOG Order"
                value={
                  order.bog_order_id ? <CopyId id={order.bog_order_id} /> : "—"
                }
                mono
              />
              <KeyValue
                label="BOG Payment"
                value={
                  order.bog_payment_id ? (
                    <CopyId id={order.bog_payment_id} />
                  ) : (
                    "—"
                  )
                }
                mono
              />
              <KeyValue label="Status" value={order.bog_status ?? "—"} />
            </Panel>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Panel title={t("fulfillment")}>
            <ShippingStatusSelect
              currentValue={order.shipping_status ?? ""}
              orderId={order.id}
              locale={locale}
            />
          </Panel>

          <Panel title={t("customer")}>
            <div className="mb-3 flex items-center gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                <User className="h-5 w-5" />
              </div>

              <div className="overflow-hidden">
                <div className="truncate text-sm font-semibold">
                  {order.shipping_full_name ?? "—"}
                </div>
                <div className="truncate text-xs text-zinc-500">
                  {order.shipping_phone ?? "—"}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <MapPin className="h-3.5 w-3.5" /> {t("shippingAddress")}
              </div>

              <div className="rounded border border-zinc-100 bg-zinc-50 p-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
                {addressLines.length ? (
                  addressLines.map((l, i) => <div key={i}>{l}</div>)
                ) : (
                  <span className="italic opacity-50">{t("none")}</span>
                )}
              </div>
            </div>
          </Panel>

          <Panel title={t("paymentInfo")}>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium capitalize">
                {payment?.provider || "Unknown Provider"}
              </span>
            </div>

            <div className="space-y-1 rounded-md bg-zinc-50 p-2.5 text-xs dark:bg-zinc-800/50">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t("paymentId")}</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {payment?.provider_payment_id ? (
                    <CopyId id={payment.provider_payment_id} />
                  ) : (
                    "—"
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">{t("paidAt")}</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {order.paid_at ? formatDate(order.paid_at) : "Pending"}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
