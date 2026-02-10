import Link from "next/link";
import { requireAdmin } from "@/utils/auth/requireAdmin";
import { formatDate, formatPrice, shortId } from "@/lib/helpers";
import OrdersFilters from "./_components/OrdersFilters";
import { PaymentStatus } from "@/components/UI/PaymentStatus";
import { ShippingStatus, StatusBadge } from "@/components/UI/ShippingStatus";
import { getTranslations } from "next-intl/server";
type SearchParams = Record<string, string | string[] | undefined>;
interface Order {
  id: string;
  status: string;
  shipping_status: ShippingStatus | null;
  items_count: number;
  subtotal: number;
  discount_total: number;
  total: number;
  created_at: string;
  currency: string | null;
  curerncy: string | null;
  shipping_full_name?: string;
  shipping_phone?: string;
  shipping_city?: string;
}

// --- Helpers ---
function pickOne(v: string | string[] | undefined): string {
  if (!v) return "";
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("Admin.Orders");
  // ✅ Default paid
  // ✅ "All" is a real value: status=all
  const status = pickOne(sp.status) || "paid";
  const shippingStatus = pickOne(sp.shipping_status);
  const q = pickOne(sp.q).trim();
  const limit = Math.min(Number(pickOne(sp.limit) || "50") || 50, 200);

  const { supabase } = await requireAdmin(locale);

  let query = supabase
    .from("orders")
    .select(
      "id, created_at, status, shipping_status, total, currency, items_count, shipping_full_name, shipping_phone, shipping_city, subtotal, discount_total",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  // ✅ Apply status filter only if not "all"
  if (status !== "all") query = query.eq("status", status);

  if (shippingStatus) query = query.eq("shipping_status", shippingStatus);

  if (q) {
    const looksLikeUuid = /^[0-9a-fA-F-]{32,36}$/.test(q);
    if (looksLikeUuid) query = query.eq("id", q);
    else query = query.ilike("shipping_phone", `%${q}%`);
  }

  const { data: rawData, error } = await query;
  if (error) throw new Error(error.message);

  const orders = (rawData ?? []) as Order[];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">
            {t("subtitle", { count: orders.length })}
          </p>
        </div>
      </div>

      <OrdersFilters
        status={status}
        shippingStatus={shippingStatus}
        q={q}
        limit={String(limit)}
      />

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:block dark:border-zinc-800 dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50/50 text-zinc-500 dark:bg-zinc-900/50">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="h-10 px-4 font-medium">{t("orderId")}</th>
              <th className="h-10 px-4 font-medium">{t("date")}</th>
              <th className="h-10 px-4 font-medium">{t("customer")}</th>
              <th className="h-10 px-4 font-medium text-right">{t("items")}</th>
              <th className="h-10 px-4 font-medium text-right">{t("total")}</th>
              <th className="h-10 px-4 font-medium">{t("status")}</th>
              <th className="h-10 px-4 font-medium">{t("shipping")}</th>
              <th className="h-10 px-4 font-medium">{t("action")}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orders.map((o) => (
              <tr
                key={o.id}
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <td className="px-4 py-3 font-medium font-mono text-zinc-700 dark:text-zinc-300">
                  {shortId(o.id)}
                </td>

                <td className="px-4 py-3 text-zinc-500">
                  {formatDate(o.created_at)}
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {o.shipping_full_name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {o.shipping_phone}
                    {o.shipping_city ? ` • ${o.shipping_city}` : ""}
                  </div>
                </td>

                <td className="px-4 py-3 text-right text-zinc-600">
                  {o.items_count}
                </td>

                <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(Number(o.total), o.currency)}
                </td>

                <td className="px-4 py-3">
                  <PaymentStatus label={o.status} />
                </td>

                <td className="px-4 py-3">
                  <StatusBadge
                    order={o}
                    status={o.shipping_status as ShippingStatus | null}
                  />
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/${locale}/admin/orders/${o.id}`}
                    className="text-xs font-medium text-zinc-600 underline-offset-4 hover:text-black hover:underline dark:text-zinc-400 dark:hover:text-white"
                  >
                    {t("view")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="mb-3 flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <Link
                  href={`/${locale}/admin/orders/${o.id}`}
                  className="font-mono text-sm font-bold text-blue-600"
                >
                  #{shortId(o.id)}
                </Link>
                <div className="text-xs text-zinc-500">
                  {formatDate(o.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {formatPrice(Number(o.total), o.currency)}
                </div>
                <div className="text-xs text-zinc-500">
                  {o.items_count} {t("items")}{" "}
                </div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-400 mb-1">{t("status")}</div>
                <PaymentStatus label={o.status} />
              </div>
              <div>
                <div className="text-xs text-zinc-400 mb-1">
                  {t("shipping")}
                </div>
                <StatusBadge
                  order={o}
                  status={o.shipping_status as ShippingStatus | null}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {o.shipping_full_name}
                </span>
                <span className="text-zinc-500 text-xs">
                  {o.shipping_phone}
                </span>
              </div>
              <Link
                href={`/${locale}/admin/orders/${o.id}`}
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
              >
                {t("view")}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {!orders.length && (
        <div className="flex min-h-75 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {t("noOrders")}
          </div>
        </div>
      )}
    </div>
  );
}
