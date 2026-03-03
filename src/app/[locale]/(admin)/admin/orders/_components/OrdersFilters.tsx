"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X, Filter, Loader2 } from "lucide-react";

type Props = {
  status: string;
  shippingStatus: string;
  q: string;
  limit: string;
};

const LIMIT_OPTIONS = ["25", "50", "100", "200"];

export default function OrdersFilters({
  status,
  shippingStatus,
  q,
  limit,
}: Props) {
  const t = useTranslations("Admin.Orders");
  const router = useRouter();
  const pathname = usePathname();

  const [isPending, startTransition] = useTransition();

  // Local state initialized directly from props
  const [filters, setFilters] = useState({
    status,
    shippingStatus,
    q,
    limit,
  });

  // Sync local state when URL changes (e.g., back button or server-side update)
  useEffect(() => {
    setFilters({ status, shippingStatus, q, limit });
  }, [status, shippingStatus, q, limit]);

  // Centralized navigation logic
  const navigate = useCallback(
    (updated: typeof filters) => {
      const p = new URLSearchParams();

      // We explicitly set the status (even "all") to avoid server-side defaults
      p.set("status", updated.status);
      p.set("limit", updated.limit);

      if (updated.shippingStatus)
        p.set("shipping_status", updated.shippingStatus);

      const cleanQ = updated.q.trim();
      if (cleanQ) p.set("q", cleanQ);

      startTransition(() => {
        router.push(`${pathname}?${p.toString()}`);
      });
    },
    [pathname, router],
  );

  const handleSelectChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    navigate(next); // Apply dropdowns immediately
  };

  const handleClear = () => {
    const reset = { status: "paid", shippingStatus: "", q: "", limit: "50" };
    setFilters(reset);
    navigate(reset);
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search */}
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              className="h-9 w-full rounded-md border border-zinc-200 bg-transparent pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && navigate(filters)}
              placeholder={t("searchPlaceholder")}
            />
          </div>
        </div>

        {/* Payment Status */}
        <div className="w-full space-y-1.5 md:w-44">
          <label className="text-xs font-medium text-zinc-500">
            {t("paymentLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.status}
            onChange={(e) => handleSelectChange("status", e.target.value)}
          >
            <option value="all">{t("all")}</option>
            <option value="paid">{t("paid")}</option>
            <option value="pending_payment">{t("pending")}</option>
            <option value="failed">{t("failed")}</option>
            <option value="cancelled">{t("cancelled")}</option>
          </select>
        </div>

        {/* Shipping Status */}
        <div className="w-full space-y-1.5 md:w-44">
          <label className="text-xs font-medium text-zinc-500">
            {t("shippingLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.shippingStatus}
            onChange={(e) =>
              handleSelectChange("shippingStatus", e.target.value)
            }
          >
            <option value="">{t("all")}</option>
            <option value="not_started">{t("notStarted")}</option>
            <option value="confirmed">{t("confirmed")}</option>
            <option value="in_transit">{t("inTransit")}</option>
            <option value="delivered">{t("delivered")}</option>
          </select>
        </div>

        {/* Limit */}
        <div className="w-20 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            {t("rowsLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.limit}
            onChange={(e) => handleSelectChange("limit", e.target.value)}
          >
            {LIMIT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 md:pt-0">
          <button
            onClick={() => navigate(filters)}
            disabled={isPending}
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Filter className="mr-2 h-4 w-4" />
            )}
            {t("apply")}
          </button>

          <button
            onClick={handleClear}
            disabled={isPending}
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
