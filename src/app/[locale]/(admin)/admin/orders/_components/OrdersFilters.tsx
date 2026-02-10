"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X, Filter } from "lucide-react";

type Props = {
  status: string; // "paid" | "all" | ...
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
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const STATUS_OPTIONS = useMemo(
    () => [
      { value: "paid", label: t("paid") },
      { value: "all", label: t("all") },
      { value: "pending_payment", label: t("pending") },
      { value: "failed", label: t("failed") },
      { value: "cancelled", label: t("cancelled") },
      { value: "fulfilled", label: t("fulfilled") },
    ],
    [t],
  );

  const SHIPPING_OPTIONS = useMemo(
    () => [
      { value: "", label: t("all") },
      { value: "confirmed", label: t("confirmed") },
      { value: "in_transit", label: t("inTransit") },
      { value: "delivered", label: t("delivered") },
    ],
    [t],
  );

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

  const handleApply = () => {
    const p = new URLSearchParams(searchParams.toString());

    p.set("status", filters.status || "paid");

    if (filters.shippingStatus)
      p.set("shipping_status", filters.shippingStatus);
    else p.delete("shipping_status");

    const cleanQ = filters.q.trim();
    if (cleanQ) p.set("q", cleanQ);
    else p.delete("q");

    if (filters.limit) p.set("limit", filters.limit);
    else p.delete("limit");

    p.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  const handleClear = () => {
    const next = { status: "paid", shippingStatus: "", q: "", limit: "50" };
    setFilters(next);

    const p = new URLSearchParams();
    p.set("status", "paid");
    p.set("limit", "50");

    startTransition(() => {
      router.push(`${pathname}?${p.toString()}`);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleApply();
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
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

        <div className="w-full space-y-1.5 md:w-44">
          <label className="text-xs font-medium text-zinc-500">
            {t("paymentLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full space-y-1.5 md:w-44">
          <label className="text-xs font-medium text-zinc-500">
            {t("shippingLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.shippingStatus}
            onChange={(e) =>
              setFilters({ ...filters, shippingStatus: e.target.value })
            }
          >
            {SHIPPING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="w-20 space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">
            {t("rowsLabel")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-zinc-200 bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:focus:ring-white"
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
          >
            {LIMIT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2 md:pt-0">
          <button
            onClick={handleApply}
            disabled={isPending}
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isPending ? "..." : <Filter className="mr-2 h-4 w-4" />}
            {isPending ? t("loading") : t("apply")}
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
