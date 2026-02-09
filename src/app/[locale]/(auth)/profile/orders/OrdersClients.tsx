"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { OrderType } from "./page";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  LogIn,
  Package,
  ShoppingBag,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/helpers";
import { isFailedStatus, isPaidStatus } from "@/utils/type-guards";
import { StatusBadge } from "@/components/UI/ShippingStatus";
import { CopyId } from "@/components/UI/CopyButton";

type Props = {
  myOrders?: OrderType[] | null;
  view?: "ok" | "unauth" | "error";
};

function OrderRow({ order, href }: { order: OrderType; href: string }) {
  const t = useTranslations("Profile.orders");
  const shipping = isPaidStatus(order.status) ? order.shipping_status : null;

  return (
    <Link
      href={href}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:text-gray-900 group-hover:bg-gray-100 transition-colors">
        <Package className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <CopyId id={order.id} />
          </span>

          <span className="text-gray-300">|</span>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{formatDate(order.created_at)}</span>
          </div>
        </div>

        <div className="sm:hidden mt-2 mb-3">
          <p className="text-lg font-bold text-gray-900 tabular-nums">
            {formatPrice(order.total, order.currency ?? "GEL")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t("itemsCount", { count: order.items_count })}
          </p>
        </div>

        <StatusBadge order={order} status={shipping} />
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-6 sm:border-l border-gray-100">
        <div className="hidden sm:block text-right">
          <p className="text-lg font-bold text-gray-900 tabular-nums">
            {formatPrice(order.total, order.currency ?? "GEL")}
          </p>
          <p className="text-xs text-gray-500">
            {t("itemsCount", { count: order.items_count })}
          </p>
        </div>

        <div className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:border-black group-hover:text-white transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState(props: {
  icon: React.ElementType;
  title: string;
  cta?: { href: string; label: string };
}) {
  const Icon = props.icon;

  return (
    <section className="max-w-xl mx-auto py-16 px-4">
      <div className="text-center p-10 rounded-3xl border border-gray-200 bg-white">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <p className="font-semibold text-gray-900">{props.title}</p>

        {props.cta && (
          <Link
            href={props.cta.href}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-black px-8 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {props.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

export default function OrdersClients({ myOrders, view = "ok" }: Props) {
  const t = useTranslations("Profile.orders");
  const locale = useLocale();

  // ✅ ONLY PAID ORDERS reach the UI (even if server accidentally sends more)
  const orders = useMemo(() => {
    const arr = Array.isArray(myOrders) ? myOrders : [];
    return arr.filter((o) => isPaidStatus(o.status));
  }, [myOrders]);

  // ✅ keep failed only if you want to show them, but you're asking "only paid"
  // so failed list will be empty. still safe if some "failed" statuses sneak in.
  const { activeList, failedList } = useMemo(() => {
    const failed: OrderType[] = [];
    const active: OrderType[] = [];

    for (const o of orders) {
      if (isFailedStatus(o.status)) failed.push(o);
      else active.push(o);
    }

    return { activeList: active, failedList: failed };
  }, [orders]);

  const baseOrdersHref = `/${locale}/profile/orders`;

  const [showFailed, setShowFailed] = useState(false);

  if (view === "unauth") {
    return (
      <EmptyState
        icon={LogIn}
        title={t("logintoView")}
        cta={{ href: `/${locale}/login`, label: t("loginCta") }}
      />
    );
  }

  if (view === "error") {
    return (
      <section className="max-w-xl mx-auto py-16 px-4">
        <div className="text-center p-8 rounded-3xl border border-rose-100 bg-rose-50">
          <AlertTriangle className="mx-auto w-8 h-8 text-rose-500 mb-2" />
          <p className="font-medium text-rose-900">{t("failedToLoad")}</p>
        </div>
      </section>
    );
  }

  if (view === "ok" && orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t("noOrders")}
        cta={{ href: `/${locale}`, label: t("continueShopping") }}
      />
    );
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-gray-500">{t("subtitle")}</p>
        </div>

        <div className="hidden sm:flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {t("totalOrders")}
          </span>
          <span className="text-sm font-bold text-gray-900 tabular-nums">
            {orders.length}
          </span>
        </div>
      </div>

      <div className="space-y-10">
        {/* ✅ ONLY PAID ORDERS: no pending section at all */}
        {activeList.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 rounded-full bg-gray-900" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                {t("activeOrders")}
              </h3>
            </div>

            {activeList.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                href={`${baseOrdersHref}/${order.id}`}
              />
            ))}
          </div>
        )}

        {/* Optional: if you still want failed toggle, leave this.
           If you truly want ONLY paid, delete the whole block below. */}
        {failedList.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowFailed((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              aria-expanded={showFailed}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showFailed ? "rotate-180" : ""}`}
              />
              <span>
                {t("failedPayments")} ({failedList.length})
              </span>
            </button>

            {showFailed && (
              <div className="mt-4 space-y-4 opacity-80">
                {failedList.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    href={`${baseOrdersHref}/${order.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
