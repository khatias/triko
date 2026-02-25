"use client";

import React, { useMemo, useState } from "react";
import {
  useRouter,
  useSearchParams,
  usePathname,
  useParams,
} from "next/navigation";
import type { ShopGroup } from "@/lib/db/groups";
import { pickGroupName } from "@/lib/helpers";
type Props = {
  groups: ShopGroup[];
  onClose?: () => void;
};
import { useTranslations } from "next-intl";

const SIZES = ["ST", "S", "M", "L", "XL", "XXL"];

function clampMoney(v: string) {
  const cleaned = v.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned);
  if (Number.isNaN(n)) return "";
  return String(Math.max(0, Math.floor(n)));
}

export default function Filter({ groups, onClose }: Props) {
  const h = useTranslations("Helpers");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as "en" | "ka") ?? "en";

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "");
  const [sizes, setSizes] = useState<string[]>(
    searchParams.get("sizes") ? searchParams.get("sizes")!.split(",") : [],
  );
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "",
  );

  const activeCount = useMemo(() => {
    return (
      (sort ? 1 : 0) +
      (categoryId ? 1 : 0) +
      (sizes.length > 0 ? 1 : 0) +
      (minPrice ? 1 : 0) +
      (maxPrice ? 1 : 0)
    );
  }, [sort, categoryId, sizes, minPrice, maxPrice]);

  const sortedGroups = useMemo(() => {
    return [...groups].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }, [groups]);

  const toggleSize = (s: string) => {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (sort) params.set("sort", sort);
    else params.delete("sort");
    if (categoryId) params.set("categoryId", categoryId);
    else params.delete("categoryId");
    if (sizes.length) params.set("sizes", sizes.join(","));
    else params.delete("sizes");

    const min = clampMoney(minPrice);
    const max = clampMoney(maxPrice);
    if (min) params.set("minPrice", min);
    else params.delete("minPrice");
    if (max) params.set("maxPrice", max);
    else params.delete("maxPrice");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    onClose?.();
  };

  const clear = () => {
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    setSizes([]);
    setCategoryId("");
    router.push(pathname);
    onClose?.();
  };

  return (
    <div className="flex flex-col w-full  bg-white text-neutral-900 font-sans relative">
      <div className="flex items-center justify-between pb-6 border-b border-neutral-100 mb-6">
        <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
          {h("filters")}
          {activeCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-neutral-900 rounded-full">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <button
            onClick={clear}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
          >
            {h("clear")}
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 pb-24 lg:pb-0 custom-scrollbar">
        {/* Category */}
        <section>
          <label className="block text-sm font-bold text-neutral-900 mb-3">
            {h("category")}
          </label>
          <div className="relative group">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full appearance-none bg-white border border-neutral-200 text-sm text-neutral-800 py-2.5 pl-4 pr-10 rounded-lg outline-none transition-all cursor-pointer hover:border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            >
              <option value="">{h("allCategories")}</option>
              {sortedGroups.map((g) => (
                <option key={g.group_id} value={String(g.group_id)}>
                  {pickGroupName(g, locale)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400 group-hover:text-neutral-900 transition-colors">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* Sort By */}
        <section>
          <label className="block text-sm font-bold text-neutral-900 mb-3">
            {h("sortBy")}
          </label>
          <div className="space-y-1">
            {[
              { value: "", label: h("recommended") },
              { value: "price_asc", label: h("priceLowHigh") },
              { value: "price_desc", label: h("priceHighLow") },
            ].map((opt) => (
              <label
                key={opt.label}
                className="flex items-center justify-between p-2 -mx-2 rounded-lg cursor-pointer group hover:bg-neutral-50 transition-colors"
              >
                <span
                  className={`text-sm transition-colors ${sort === opt.value ? "text-neutral-900 font-medium" : "text-neutral-600 group-hover:text-neutral-900"}`}
                >
                  {opt.label}
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${sort === opt.value ? "border-neutral-900 bg-neutral-900" : "border-neutral-300 bg-white group-hover:border-neutral-400"}`}
                >
                  {sort === opt.value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={sort === opt.value}
                  onChange={() => setSort(opt.value)}
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Size */}
        <section>
          <label className="block text-sm font-bold text-neutral-900 mb-3">
            {h("size")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`min-w-10 h-10 px-2 flex items-center justify-center text-sm rounded-lg border transition-all duration-200 ${
                  sizes.includes(s)
                    ? "bg-neutral-900 text-white border-neutral-900 font-medium shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Price Range */}
        <section>
          <label className="block text-sm font-bold text-neutral-900 mb-3">
            {h("priceRange")}
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                ₾
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={h("min")}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg outline-none transition-all hover:border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
              />
            </div>
            <div className="w-4 h-px bg-neutral-300"></div>
            <div className="relative flex-1 group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">
                ₾
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={h("max")}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg outline-none transition-all hover:border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 placeholder:text-neutral-400"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-neutral-100 lg:static lg:border-none lg:p-0 lg:pt-8 lg:bg-transparent lg:backdrop-blur-none">
        <button
          onClick={apply}
          className="w-full py-3.5 text-sm font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 active:scale-[0.99]"
        >
          {h("showResults")}
        </button>
      </div>
    </div>
  );
}
