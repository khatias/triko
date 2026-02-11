"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  RotateCcw,
  Package,
  AlertCircle,
  ImageIcon,
  FileText,
  AlignLeft,
} from "lucide-react";
import type {
  AdminProductListRow,
  ProductsFiltersState,
  ProductsTab,
} from "../types/admin-products";
import { computeStatus, getGroupLabel } from "../types/admin-products";

export default function ProductsFilters({
  rows,
  locale,
  filters,
}: {
  rows: AdminProductListRow[];
  locale: string;
  filters: ProductsFiltersState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const qFromUrl = sp.get("q") ?? "";
  const [qInput, setQInput] = useState<string>(qFromUrl);

  const isEditingRef = useRef(false);

  // debounce handle
  const debounceRef = useRef<number | null>(null);

  // ✅ NEW: skip the debounced url-sync exactly once after reset
  const skipNextDebounceRef = useRef(false);

  const spString = sp.toString();

  useEffect(() => {
    if (isEditingRef.current) return;
    setQInput(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    // ✅ if we just reset, do NOT schedule the debounce
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const current = new URLSearchParams(spString);
      const next = new URLSearchParams(spString);

      const q = qInput.trim();
      if (!q) next.delete("q");
      else next.set("q", q);

      if (next.toString() !== current.toString()) {
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [qInput, spString, pathname, router]);

  const pushParams = useCallback(
    (mut: (p: URLSearchParams) => void, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(spString);
      mut(next);
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "replace") router.replace(url);
      else router.push(url);
    },
    [spString, pathname, router],
  );

  const setParam = useCallback(
    (
      key: string,
      value: string,
      opts?: { defaultValue?: string; mode?: "push" | "replace" },
    ) => {
      const defaultValue = opts?.defaultValue;
      const mode = opts?.mode ?? "push";

      pushParams(
        (p) => {
          const v = value?.trim() ?? "";
          if (!v || (defaultValue != null && v === defaultValue)) p.delete(key);
          else p.set(key, v);
        },
        mode,
      );
    },
    [pushParams],
  );

  const setTab = useCallback(
    (tab: ProductsTab) => {
      pushParams((p) => {
        p.set("tab", tab);
      });
    },
    [pushParams],
  );

  const resetAll = useCallback(() => {
    // cancel any pending debounce
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    // ✅ prevent the qInput effect from writing URL after this reset
    skipNextDebounceRef.current = true;

    isEditingRef.current = false;
    setQInput("");

    const next = new URLSearchParams();
    next.set("tab", filters.tab);

    router.replace(`/${locale}/admin/products?${next.toString()}`);
  }, [filters.tab, locale, router]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(getGroupLabel(r));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const base = useMemo(() => {
    const qLower = (filters.q ?? "").trim().toLowerCase();

    return rows
      .filter((r) => {
        if (!qLower) return true;
        const hay =
          `${r.parent_code} ${r.name ?? ""} ${getGroupLabel(r)}`.toLowerCase();
        return hay.includes(qLower);
      })
      .filter((r) => {
        if (!filters.group) return true;
        return getGroupLabel(r) === filters.group;
      })
      .filter((r) => {
        const stock = r.total_stock ?? 0;
        if (filters.stock === "in") return stock > 0;
        if (filters.stock === "out") return stock <= 0;
        return true;
      })
      .filter((r) => {
        if (filters.missing === "all") return true;
        if (filters.missing === "content") return !Boolean(r.has_content);
        if (filters.missing === "photos")
          return Boolean(r.has_content) && !Boolean(r.has_photos);
        if (filters.missing === "title")
          return Boolean(r.has_content) && !Boolean(r.has_title);
        if (filters.missing === "desc")
          return Boolean(r.has_content) && !Boolean(r.has_description);
        return true;
      });
  }, [rows, filters.q, filters.group, filters.stock, filters.missing]);

  const counts = useMemo(() => {
    return base.reduce(
      (acc, r) => {
        const s = computeStatus(r);
        acc[s] += 1;
        return acc;
      },
      { needs_work: 0, hidden: 0, live: 0 } as Record<
        "needs_work" | "hidden" | "live",
        number
      >,
    );
  }, [base]);

  const hasActiveFilters = !!(
    filters.q ||
    filters.group ||
    filters.stock !== "all" ||
    filters.missing !== "all" ||
    (filters.sort && filters.sort !== "group")
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Product Management
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              {base.length} matching products
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600">
              {counts.needs_work} need attention
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{counts.hidden} hidden</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600">{counts.live} live</span>
          </div>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <TabButton
            tab="inbox"
            active={filters.tab === "inbox"}
            count={counts.needs_work}
            onClick={() => setTab("inbox")}
            variant="warning"
          />
          <TabButton
            tab="hidden"
            active={filters.tab === "hidden"}
            count={counts.hidden}
            onClick={() => setTab("hidden")}
            variant="neutral"
          />
          <TabButton
            tab="live"
            active={filters.tab === "live"}
            count={counts.live}
            onClick={() => setTab("live")}
            variant="success"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Filters & Search</h3>
            {hasActiveFilters && (
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                Active
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  onFocus={() => {
                    isEditingRef.current = true;
                  }}
                  onBlur={() => {
                    isEditingRef.current = false;
                    setQInput((v) => v.trim());
                  }}
                  placeholder="Search by code, name, or group..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Product Group
              </label>
              <select
                value={filters.group || "all"}
                onChange={(e) =>
                  setParam("group", e.target.value, { defaultValue: "all" })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Groups</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Stock Status
              </label>
              <select
                value={filters.stock}
                onChange={(e) =>
                  setParam("stock", e.target.value, { defaultValue: "all" })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Stock</option>
                <option value="in">In Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) =>
                  setParam("sort", e.target.value, { defaultValue: "group" })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="group">Group</option>
                <option value="stock_desc">Stock Level</option>
                <option value="price_asc">Price (Low to High)</option>
                <option value="price_desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <AlertCircle className="h-4 w-4" />
                Missing Content
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterPill
                  active={filters.missing === "all"}
                  onClick={() =>
                    setParam("missing", "all", { defaultValue: "all" })
                  }
                  icon={null}
                >
                  All Products
                </FilterPill>

                <FilterPill
                  active={filters.missing === "content"}
                  onClick={() =>
                    setParam("missing", "content", { defaultValue: "all" })
                  }
                  icon={<FileText className="h-3 w-3" />}
                >
                  Content
                </FilterPill>

                <FilterPill
                  active={filters.missing === "photos"}
                  onClick={() =>
                    setParam("missing", "photos", { defaultValue: "all" })
                  }
                  icon={<ImageIcon className="h-3 w-3" />}
                >
                  Photos
                </FilterPill>

                <FilterPill
                  active={filters.missing === "title"}
                  onClick={() =>
                    setParam("missing", "title", { defaultValue: "all" })
                  }
                  icon={<FileText className="h-3 w-3" />}
                >
                  Title
                </FilterPill>

                <FilterPill
                  active={filters.missing === "desc"}
                  onClick={() =>
                    setParam("missing", "desc", { defaultValue: "all" })
                  }
                  icon={<AlignLeft className="h-3 w-3" />}
                >
                  Description
                </FilterPill>
              </div>

              <div className="ml-auto">
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  active,
  count,
  onClick,
  variant = "neutral",
}: {
  tab: "inbox" | "hidden" | "live";
  active: boolean;
  count: number;
  onClick: () => void;
  variant?: "warning" | "neutral" | "success";
}) {
  const label =
    tab === "inbox" ? "Inbox" : tab === "hidden" ? "Hidden" : "Live";

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
