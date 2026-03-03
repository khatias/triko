"use client";

import {
  useEffect,
  useState,
  useTransition,
  KeyboardEvent,
  useCallback,
} from "react";
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

  // 1. Keep local state in sync with URL props
  const [filters, setFilters] = useState({
    status: status || "paid",
    shippingStatus: shippingStatus || "",
    q: q || "",
    limit: limit || "50",
  });

  useEffect(() => {
    setFilters({
      status: status || "paid",
      shippingStatus: shippingStatus || "",
      q: q || "",
      limit: limit || "50",
    });
  }, [status, shippingStatus, q, limit]);

  // 2. Centralized Navigation Logic
  const navigate = useCallback(
    (updatedFilters: typeof filters) => {
      const p = new URLSearchParams();

      // Always include status and limit as they have defaults
      p.set("status", updatedFilters.status || "paid");
      p.set("limit", updatedFilters.limit || "50");

      if (updatedFilters.shippingStatus) {
        p.set("shipping_status", updatedFilters.shippingStatus);
      }

      const cleanQ = updatedFilters.q.trim();
      if (cleanQ) {
        p.set("q", cleanQ);
      }

      // Reset pagination on filter change
      p.delete("page");

      startTransition(() => {
        router.push(`${pathname}?${p.toString()}`);
      });
    },
    [pathname, router],
  );

  // 3. Handlers
  const handleSelectChange = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    navigate(next); // Apply immediately for dropdowns
  };

  const handleApplySearch = () => {
    navigate(filters);
  };

  const handleClear = () => {
    const reset = { status: "paid", shippingStatus: "", q: "", limit: "50" };
    setFilters(reset);
    navigate(reset);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApplySearch();
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search Input */}
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
              onKeyDown={handleKeyDown}
              placeholder={t("searchPlaceholder")}
            />
          </div>
        </div>

        {/* Payment Status Dropdown */}
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

        {/* Shipping Status Dropdown */}
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

        {/* Limit Dropdown */}
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 md:pt-0">
          <button
            onClick={handleApplySearch}
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
            title={t("resetTitle")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
