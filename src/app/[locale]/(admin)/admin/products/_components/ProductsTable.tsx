import Link from "next/link";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Package2,
  Coins,
} from "lucide-react";
import type {
  AdminProductListRow,
  ProductsFiltersState,
} from "../types/admin-products";
import { computeStatus, getGroupLabel } from "../types/admin-products";
import { getTranslations } from "next-intl/server";
import EmptyState from "../../EmptyState";
export default async function ProductsTable({
  rows,
  locale,
  filters,
}: {
  rows: AdminProductListRow[];
  locale: string;
  filters: ProductsFiltersState;
}) {
  const t = await getTranslations("Admin.Products");

  const qLower = filters.q.trim().toLowerCase();

  let filtered = rows
    .filter((r) => {
      const s = computeStatus(r);
      if (filters.tab === "inbox") return s === "needs_work";
      if (filters.tab === "hidden") return s === "hidden";
      return s === "live";
    })
    .filter((r) => {
      if (!qLower) return true;
      const hay =
        `${r.parent_code} ${r.name ?? ""} ${getGroupLabel(r, locale)}`.toLowerCase();
      return hay.includes(qLower);
    })
    .filter((r) => {
      if (!filters.group) return true;
      return getGroupLabel(r, locale) === filters.group;
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

  filtered = filtered.slice().sort((a, b) => {
    if (filters.sort === "stock_desc")
      return (b.total_stock ?? 0) - (a.total_stock ?? 0);

    const aMin = a.min_price ?? Number.POSITIVE_INFINITY;
    const bMin = b.min_price ?? Number.POSITIVE_INFINITY;

    if (filters.sort === "price_asc") return aMin - bMin;
    if (filters.sort === "price_desc") return bMin - aMin;

    const gA = getGroupLabel(a, locale);
    const gB = getGroupLabel(b, locale);
    const c = gA.localeCompare(gB);
    if (c !== 0) return c;
    return a.parent_code.localeCompare(b.parent_code);
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Package2 className="h-12 w-12 text-slate-400" />}
        title={t("empty.title")}
        description={t("empty.desc")}
      />
    );
  }

  return (
    <div className="mt-6">
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((r) => {
          const status = computeStatus(r);
          const group = getGroupLabel(r, locale);
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

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div className="col-span-3">{t("table.code")}</div>
          <div className="col-span-4">{t("table.name")}</div>
          <div className="col-span-2">{t("table.group")}</div>
          <div className="col-span-1 text-center">{t("table.stock")}</div>
          <div className="col-span-2 text-right">{t("table.price")}</div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.map((r) => {
            const status = computeStatus(r);
            const group = getGroupLabel(r, locale);
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
                  <div className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
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
                    <div className="text-xs text-slate-500">{stockLabel}</div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      {price}
                    </div>
                    {r.min_price != null && (
                      <div className="mt-1 flex items-center gap-1 justify-end text-xs text-slate-500">
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
  );
}

function StatusPill({
  t,
  status,
}: {
  t: Awaited<ReturnType<typeof getTranslations>>;
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
  };

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
  t: Awaited<ReturnType<typeof getTranslations>>;
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
