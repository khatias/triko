import React from "react";
import { Link } from "@/i18n/routing";
import {
  DollarSign,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { fetchAdminDashboard } from "../_quries/dashboard";
import { formatDate, formatPrice } from "@/lib/helpers";

type Props = {
  params: { locale: string } | Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await Promise.resolve(params);

  const t = await getTranslations({
    locale,
    namespace: "Admin.AdminDashboard",
  });

  const { stats, recentOrders } = await fetchAdminDashboard(locale);

  const customersTrendUp = stats.newCustomers30d > 0;

  return (
    <div className="min-h-screen space-y-8 bg-zinc-50/50 p-6 lg:p-10">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="text-sm text-zinc-500">{t("subtitle")}</p>
      </header>

      {/* Stats Section */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("cards.revenue")}
          value={formatPrice(stats.revenue30d, stats.currency) ?? ""}
          trend={t("cards.last30Days")}
          trendUp
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          title={t("cards.orders")}
          value={String(stats.orders30d)}
          trend={t("cards.last30Days")}
          trendUp
          icon={ShoppingBag}
          accent="blue"
        />
        <StatCard
          title={t("cards.products")}
          value={String(stats.productsCount)}
          trend={t("cards.total")}
          trendUp
          icon={Package}
          accent="amber"
        />
        <StatCard
          title={t("cards.customers")}
          value={String(stats.customersCount)}
          trend={t("cards.newCustomersLast30Days", {
            count: stats.newCustomers30d,
          })}
          trendUp={customersTrendUp}
          icon={Users}
          accent="violet"
        />
      </section>

      {/* Recent Orders Section */}
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold text-zinc-900">
              {t("recentOrders.title")}
            </h3>
          </div>

          {/* ✅ use locale-less href with next-intl Link */}
          <Link
            href="/admin/orders"
            className="group flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            {t("recentOrders.viewAll")}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="p-2">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
              <ShoppingBag className="mb-3 h-10 w-10 text-zinc-300" />
              <p>{t("recentOrders.empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentOrders.map((o) => (
                <Link href={`/admin/orders/${o.id}`} key={o.id}>
                  <div className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-zinc-50">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200 transition-colors group-hover:bg-white group-hover:shadow-sm">
                        <CreditCard className="h-5 w-5 text-zinc-400 group-hover:text-zinc-600" />
                      </div>

                      <div className="flex flex-col">
                        <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                          {t("recentOrders.order")}
                          <span className="font-mono text-xs text-zinc-500">
                            #{o.id.slice(0, 8)}
                          </span>
                        </span>

               
                        <span className="text-xs text-zinc-500">
                          {formatDate(o.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-900">
                        {formatPrice(o.total, o.currency)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accent: "emerald" | "blue" | "amber" | "violet";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-600/20",
    blue: "bg-blue-50 text-blue-600 ring-blue-600/20",
    amber: "bg-amber-50 text-amber-600 ring-amber-600/20",
    violet: "bg-violet-50 text-violet-600 ring-violet-600/20",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset transition-colors ${styles[accent]}`}
        >
          <Icon className="h-6 w-6" />
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
            trendUp
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
          aria-label={trendUp ? "trend up" : "trend down"}
        >
          {trendUp ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
        <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
          {value}
        </p>
      </div>

      <div className="mt-3 text-xs font-medium text-zinc-400">
        <span className={trendUp ? "text-emerald-600" : "text-red-600"}>
          {trend}
        </span>
      </div>
    </div>
  );
}
