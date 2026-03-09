// src/app/[locale]/admin/products/_components/AdminProductsClient.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useDeferredValue,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Search,
  Filter,
  RotateCcw,
  Package,
  AlertCircle,
  ImageIcon,
  FileText,
  AlignLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Package2,
  Coins,
} from "lucide-react";

import type { AdminProductListRow } from "../types/admin-products";
import {
  computeStatus,
  getGroupLabel,
  coerceQ,
  coerceTab,
  coerceStr,
  coerceStock,
  coerceMissing,
  coerceSort,
  type ProductsFiltersState,
  type ProductsTab,
} from "../types/admin-products";

type Initial = {
  tab?: string;
  q?: string;
  group?: string;
  stock?: string;
  missing?: string;
  sort?: string;
};

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
        {icon}
      </div>
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm text-slate-600">{description}</div>
    </div>
  );
}

export default function AdminProductsClient({
  rows,
  locale,
  initial,
}: {
  rows: AdminProductListRow[];
  locale: string;
  initial: Initial;
}) {
  const t = useTranslations("Admin.Products");

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // refs for URL synchronization correctness
  const debounceRef = useRef<number | null>(null);
  const internalNavRef = useRef(false); // true when we call router.replace
  const skipNextUrlSyncRef = useRef(false); // skip one debounced sync after manual replace

  // initial filters (prefer current URL, fallback to server initial)
  const initialFilters: ProductsFiltersState = useMemo(
    () => ({
      tab: coerceTab(sp.get("tab") ?? initial.tab ?? "inbox"),
      q: coerceQ(sp.get("q") ?? initial.q ?? ""),
      group: coerceStr(sp.get("group") ?? initial.group ?? ""),
      stock: coerceStock(sp.get("stock") ?? initial.stock ?? "all"),
      missing: coerceMissing(sp.get("missing") ?? initial.missing ?? "all"),
      sort: coerceSort(sp.get("sort") ?? initial.sort ?? "group"),
      discount: "all",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [filters, setFilters] = useState<ProductsFiltersState>(initialFilters);

  // local search input (fast typing)
  const [qInput, setQInput] = useState(filters.q ?? "");
  const deferredQ = useDeferredValue(qInput);

  // precompute group + search string once
  const prepared = useMemo(() => {
    return rows.map((r) => {
      const group = getGroupLabel(r, locale);
      const search = `${r.parent_code} ${r.name ?? ""} ${group}`.toLowerCase();
      return { r, group, search };
    });
  }, [rows, locale]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const x of prepared) set.add(x.group);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [prepared]);

  // filter + sort (single source)
  const filtered = useMemo(() => {
    const tab = filters.tab;
    const qLower = (deferredQ ?? "").trim().toLowerCase();
    const group = (filters.group ?? "").trim();
    const stock = filters.stock;
    const missing = filters.missing;
    const sort = filters.sort;

    let list = prepared;

    list = list.filter(({ r }) => {
      const s = computeStatus(r);
      if (tab === "inbox") return s === "needs_work";
      if (tab === "hidden") return s === "hidden";
      return s === "live";
    });

    if (qLower) list = list.filter((x) => x.search.includes(qLower));
    if (group) list = list.filter((x) => x.group === group);

    if (stock === "in") list = list.filter((x) => (x.r.total_stock ?? 0) > 0);
    if (stock === "out") list = list.filter((x) => (x.r.total_stock ?? 0) <= 0);

    list = list.filter(({ r }) => {
      if (missing === "all") return true;
      if (missing === "content") return !Boolean(r.has_content);
      if (missing === "photos")
        return Boolean(r.has_content) && !Boolean(r.has_photos);
      if (missing === "title")
        return Boolean(r.has_content) && !Boolean(r.has_title);
      if (missing === "desc")
        return Boolean(r.has_content) && !Boolean(r.has_description);
      return true;
    });

    return list.slice().sort((A, B) => {
      const a = A.r;
      const b = B.r;

      if (sort === "stock_desc")
        return (b.total_stock ?? 0) - (a.total_stock ?? 0);

      const aMin = a.min_price ?? Number.POSITIVE_INFINITY;
      const bMin = b.min_price ?? Number.POSITIVE_INFINITY;

      if (sort === "price_asc") return aMin - bMin;
      if (sort === "price_desc") return bMin - aMin;

      const c = A.group.localeCompare(B.group);
      if (c !== 0) return c;
      return a.parent_code.localeCompare(b.parent_code);
    });
  }, [
    prepared,
    filters.tab,
    filters.group,
    filters.stock,
    filters.missing,
    filters.sort,
    deferredQ,
  ]);

  // counts for tabs (filters except tab)
  const counts = useMemo(() => {
    const qLower = (deferredQ ?? "").trim().toLowerCase();
    const group = (filters.group ?? "").trim();
    const stock = filters.stock;
    const missing = filters.missing;

    let list = prepared;

    if (qLower) list = list.filter((x) => x.search.includes(qLower));
    if (group) list = list.filter((x) => x.group === group);

    if (stock === "in") list = list.filter((x) => (x.r.total_stock ?? 0) > 0);
    if (stock === "out") list = list.filter((x) => (x.r.total_stock ?? 0) <= 0);

    list = list.filter(({ r }) => {
      if (missing === "all") return true;
      if (missing === "content") return !Boolean(r.has_content);
      if (missing === "photos")
        return Boolean(r.has_content) && !Boolean(r.has_photos);
      if (missing === "title")
        return Boolean(r.has_content) && !Boolean(r.has_title);
      if (missing === "desc")
        return Boolean(r.has_content) && !Boolean(r.has_description);
      return true;
    });

    const acc = { needs_work: 0, hidden: 0, live: 0 } as Record<
      "needs_work" | "hidden" | "live",
      number
    >;

    for (const x of list) acc[computeStatus(x.r)] += 1;
    return acc;
  }, [prepared, filters.group, filters.stock, filters.missing, deferredQ]);

  const hasActiveFilters = !!(
    (qInput ?? "").trim() ||
    filters.group ||
    filters.stock !== "all" ||
    filters.missing !== "all" ||
    (filters.sort && filters.sort !== "group")
  );

  // Immediate replace helper (used by clear/reset) - cancels debounce and prevents re-overwrite
  const replaceUrlNow = useCallback(
    (params: URLSearchParams) => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      // prevent the next debounced syncUrl call from re-adding q/group/etc
      skipNextUrlSyncRef.current = true;

      internalNavRef.current = true;
      const url = `${pathname}?${params.toString()}`;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [pathname, router, startTransition],
  );

  // Debounced URL sync for normal interaction (typing, selects, pills, tabs)
  const syncUrlDebounced = useCallback(
    (nextFilters: ProductsFiltersState, nextQInput: string) => {
      if (skipNextUrlSyncRef.current) {
        skipNextUrlSyncRef.current = false;
        return;
      }

      if (debounceRef.current) window.clearTimeout(debounceRef.current);

      debounceRef.current = window.setTimeout(() => {
        const p = new URLSearchParams();
        p.set("tab", nextFilters.tab);

        const q = (nextQInput ?? "").trim();
        if (q) p.set("q", q);

        if (nextFilters.group) p.set("group", nextFilters.group);
        if (nextFilters.stock !== "all") p.set("stock", nextFilters.stock);
        if (nextFilters.missing !== "all")
          p.set("missing", nextFilters.missing);
        if (nextFilters.sort !== "group") p.set("sort", nextFilters.sort);

        internalNavRef.current = true;
        startTransition(() => {
          router.replace(`${pathname}?${p.toString()}`, { scroll: false });
        });
      }, 250);
    },
    [pathname, router, startTransition],
  );

  // state -> url (debounced)
  useEffect(() => {
    syncUrlDebounced(filters, qInput);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [filters, qInput, syncUrlDebounced]);

  // url -> state (ONLY for real browser back/forward / external navigation)
  useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }

    const next: ProductsFiltersState = {
      tab: coerceTab(sp.get("tab") ?? "inbox"),
      q: coerceQ(sp.get("q") ?? ""),
      group: coerceStr(sp.get("group") ?? ""),
      stock: coerceStock(sp.get("stock") ?? "all"),
      missing: coerceMissing(sp.get("missing") ?? "all"),
      sort: coerceSort(sp.get("sort") ?? "group"),
      discount: "all",
    };

    setFilters(next);
    setQInput(next.q ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  const setTab = useCallback((tab: ProductsTab) => {
    setFilters((s) => ({ ...s, tab }));
  }, []);

  const setParam = useCallback(
    (key: keyof ProductsFiltersState, value: string) => {
      setFilters((s) => ({ ...s, [key]: value as unknown }));
    },
    [],
  );

  // Reset (FORCE INBOX) - URL updates immediately without q
  const resetAll = useCallback(() => {
    const p = new URLSearchParams();
    p.set("tab", "inbox");
    replaceUrlNow(p);

    setQInput("");
    setFilters({
      tab: "inbox",
      q: "",
      group: "",
      stock: "all",
      missing: "all",
      sort: "group",
      discount: "all",
    });
  }, [replaceUrlNow]);

  return (
    <div className="space-y-6">
      {/* header + tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
            {isPending && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                …
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>{t("matching", { count: filtered.length })}</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600">
              {t("needAttention", { count: counts.needs_work })}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">
              {t("hiddenCount", { count: counts.hidden })}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600">
              {t("liveCount", { count: counts.live })}
            </span>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <TabButton
            label={t("tabs.inbox")}
            active={filters.tab === "inbox"}
            count={counts.needs_work}
            onClick={() => setTab("inbox")}
            variant="warning"
          />
          <TabButton
            label={t("tabs.hidden")}
            active={filters.tab === "hidden"}
            count={counts.hidden}
            onClick={() => setTab("hidden")}
            variant="neutral"
          />
          <TabButton
            label={t("tabs.live")}
            active={filters.tab === "live"}
            count={counts.live}
            onClick={() => setTab("live")}
            variant="success"
          />
        </div>
      </div>

      {/* filters card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">
              {t("filtersTitle")}
            </h3>
            {hasActiveFilters && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                {t("active")}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("searchLabel")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  onBlur={() => setQInput((v) => v.trim())}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("groupLabel")}
              </label>
              <select
                value={filters.group || "all"}
                onChange={(e) =>
                  setParam(
                    "group",
                    e.target.value === "all" ? "" : e.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">{t("allGroups")}</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("stockLabel")}
              </label>
              <select
                value={filters.stock}
                onChange={(e) => setParam("stock", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">{t("stock.all")}</option>
                <option value="in">{t("stock.in")}</option>
                <option value="out">{t("stock.out")}</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t("sortLabel")}
              </label>
              <select
                value={filters.sort}
                onChange={(e) => setParam("sort", e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="group">{t("sort.group")}</option>
                <option value="stock_desc">{t("sort.stock")}</option>
                <option value="price_asc">{t("sort.priceAsc")}</option>
                <option value="price_desc">{t("sort.priceDesc")}</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <AlertCircle className="h-4 w-4" />
                {t("missingTitle")}
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterPill
                  active={filters.missing === "all"}
                  onClick={() => setParam("missing", "all")}
                  icon={null}
                >
                  {t("missing.all")}
                </FilterPill>

                <FilterPill
                  active={filters.missing === "content"}
                  onClick={() => setParam("missing", "content")}
                  icon={<FileText className="h-3 w-3" />}
                >
                  {t("missing.content")}
                </FilterPill>

                <FilterPill
                  active={filters.missing === "photos"}
                  onClick={() => setParam("missing", "photos")}
                  icon={<ImageIcon className="h-3 w-3" />}
                >
                  {t("missing.photos")}
                </FilterPill>

                <FilterPill
                  active={filters.missing === "title"}
                  onClick={() => setParam("missing", "title")}
                  icon={<FileText className="h-3 w-3" />}
                >
                  {t("missing.title")}
                </FilterPill>

                <FilterPill
                  active={filters.missing === "desc"}
                  onClick={() => setParam("missing", "desc")}
                  icon={<AlignLeft className="h-3 w-3" />}
                >
                  {t("missing.desc")}
                </FilterPill>
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                >
                  {t("clearFilters")}
                </button> */}

                <button
                  type="button"
                  onClick={resetAll}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("reset")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package2 className="h-12 w-12 text-slate-400" />}
          title={t("empty.title")}
          description={t("empty.desc")}
        />
      ) : (
        <div className="mt-6">
          {/* Mobile */}
          <div className="space-y-3 md:hidden">
            {filtered.map(({ r, group }) => {
              const status = computeStatus(r);
              const stockLevel = r.total_stock ?? 0;

              const price =
                r.min_price == null
                  ? "—"
                  : r.max_price != null && r.max_price !== r.min_price
                    ? `₾${r.min_price}–₾${r.max_price}`
                    : `₾${r.min_price}`;

              return (
                <Link
                  key={r.parent_code}
                  href={`/${locale}/admin/products/${encodeURIComponent(r.parent_code)}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold text-slate-900">
                        {r.parent_code}
                      </div>
                      <div className="mt-1 truncate text-sm text-slate-700">
                        {r.name || t("table.noName")}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill t={t} status={status} />
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          <Package2 className="h-3 w-3" />
                          {group}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-xs text-slate-500">
                        {t("table.stock")}
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        {stockLevel}
                      </div>
                      <div className="text-xs text-slate-500">{price}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-3">{t("table.code")}</div>
              <div className="col-span-4">{t("table.name")}</div>
              <div className="col-span-2">{t("table.group")}</div>
              <div className="col-span-1 text-center">{t("table.stock")}</div>
              <div className="col-span-2 text-right">{t("table.price")}</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filtered.map(({ r, group }) => {
                const status = computeStatus(r);
                const stockLevel = r.total_stock ?? 0;

                const price =
                  r.min_price == null
                    ? "—"
                    : r.max_price != null && r.max_price !== r.min_price
                      ? `₾${r.min_price}–₾${r.max_price}`
                      : `₾${r.min_price}`;

                const stockTone =
                  stockLevel > 10
                    ? "text-emerald-600"
                    : stockLevel > 0
                      ? "text-amber-600"
                      : "text-red-600";

                const stockLabel =
                  stockLevel > 10
                    ? t("stock.in")
                    : stockLevel > 0
                      ? t("stock.low")
                      : t("stock.out");

                return (
                  <Link
                    key={r.parent_code}
                    href={`/${locale}/admin/products/${encodeURIComponent(r.parent_code)}`}
                    className="group grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="col-span-3">
                      <div className="font-mono text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                        {r.parent_code}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <StatusPill t={t} status={status} />
                        <Hints t={t} r={r} />
                      </div>
                    </div>

                    <div className="col-span-4 flex items-center">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {r.name || t("table.noName")}
                        </div>
                        {!r.name && (
                          <div className="mt-1 text-xs text-slate-500">
                            {t("table.nameMissing")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        <Package2 className="h-3 w-3" />
                        {group}
                      </span>
                    </div>

                    <div className="col-span-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-sm font-semibold ${stockTone}`}>
                          {stockLevel}
                        </div>
                        <div className="text-xs text-slate-500">
                          {stockLabel}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {price}
                        </div>
                        {r.min_price != null && (
                          <div className="mt-1 flex items-center justify-end gap-1 text-xs text-slate-500">
                            <Coins className="h-3 w-3" />
                            {t("table.pricingSet")}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  count,
  onClick,
  variant = "neutral",
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
  variant?: "warning" | "neutral" | "success";
}) {
  const variantStyles = {
    warning: active
      ? "bg-amber-500 text-white shadow-lg shadow-amber-200"
      : "text-amber-700 hover:bg-amber-50",
    neutral: active
      ? "bg-slate-600 text-white shadow-lg shadow-slate-200"
      : "text-slate-700 hover:bg-slate-50",
    success: active
      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
      : "text-emerald-700 hover:bg-emerald-50",
  };

  const baseStyles =
    "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200";
  const styles = `${baseStyles} ${variantStyles[variant]}`;

  return (
    <button type="button" className={styles} onClick={onClick}>
      {label}
      <span className={active ? "ml-1 text-white/80" : "ml-1 text-slate-500"}>
        ({count})
      </span>
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const styles = active
    ? "bg-blue-500 text-white shadow-sm shadow-blue-200 ring-1 ring-blue-500"
    : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50";

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${styles}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function StatusPill({
  t,
  status,
}: {
  t: ReturnType<typeof useTranslations>;
  status: "needs_work" | "hidden" | "live";
}) {
  const configs = {
    live: {
      label: t("status.live"),
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    },
    hidden: {
      label: t("status.hidden"),
      icon: <EyeOff className="h-3 w-3" />,
      className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    },
    needs_work: {
      label: t("status.needsWork"),
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-red-100 text-red-700 ring-1 ring-red-200",
    },
  } as const;

  const c = configs[status];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function Hints({
  t,
  r,
}: {
  t: ReturnType<typeof useTranslations>;
  r: Pick<
    AdminProductListRow,
    "has_content" | "has_photos" | "has_title" | "has_description"
  >;
}) {
  const issues: Array<{ label: string; icon: React.ReactNode }> = [];

  if (!r.has_content)
    issues.push({
      label: t("hints.noContent"),
      icon: <AlertTriangle className="h-3 w-3" />,
    });
  if (r.has_content && !r.has_photos)
    issues.push({
      label: t("hints.noPhotos"),
      icon: <Eye className="h-3 w-3" />,
    });
  if (r.has_content && !r.has_title)
    issues.push({
      label: t("hints.noTitle"),
      icon: <AlertTriangle className="h-3 w-3" />,
    });
  if (r.has_content && !r.has_description)
    issues.push({
      label: t("hints.noDesc"),
      icon: <AlertTriangle className="h-3 w-3" />,
    });

  if (issues.length === 0) return null;

  return (
    <>
      {issues.slice(0, 2).map((issue) => (
        <span
          key={issue.label}
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
        >
          {issue.icon}
          {issue.label}
        </span>
      ))}
      {issues.length > 2 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          <AlertTriangle className="h-3 w-3" />
          {t("hints.more", { count: issues.length - 2 })}
        </span>
      )}
    </>
  );
}
