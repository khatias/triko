import Link from "next/link"
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Package2, Coins } from "lucide-react"
import type { AdminProductListRow, ProductsFiltersState } from "../types/admin-products"
import { computeStatus, getGroupLabel } from "../types/admin-products"

export default function ProductsTable({
  rows,
  locale,
  filters,
}: {
  rows: AdminProductListRow[]
  locale: string
  filters: ProductsFiltersState
}) {
  const qLower = filters.q.trim().toLowerCase()

  let filtered = rows
    .filter((r) => {
      const s = computeStatus(r)
      if (filters.tab === "inbox") return s === "needs_work"
      if (filters.tab === "hidden") return s === "hidden"
      return s === "live"
    })
    .filter((r) => {
      if (!qLower) return true
      const hay = `${r.parent_code} ${r.name ?? ""} ${getGroupLabel(r)}`.toLowerCase()
      return hay.includes(qLower)
    })
    .filter((r) => {
      if (!filters.group) return true
      return getGroupLabel(r) === filters.group
    })
    .filter((r) => {
      const stock = r.total_stock ?? 0
      if (filters.stock === "in") return stock > 0
      if (filters.stock === "out") return stock <= 0
      return true
    })
    .filter((r) => {
      if (filters.missing === "all") return true
      if (filters.missing === "content") return !Boolean(r.has_content)
      if (filters.missing === "photos") return Boolean(r.has_content) && !Boolean(r.has_photos)
      if (filters.missing === "title") return Boolean(r.has_content) && !Boolean(r.has_title)
      if (filters.missing === "desc") return Boolean(r.has_content) && !Boolean(r.has_description)
      return true
    })

  // Enhanced sorting
  filtered = filtered.slice().sort((a, b) => {
    if (filters.sort === "stock_desc") return (b.total_stock ?? 0) - (a.total_stock ?? 0)

    const aMin = a.min_price ?? Number.POSITIVE_INFINITY
    const bMin = b.min_price ?? Number.POSITIVE_INFINITY

    if (filters.sort === "price_asc") return aMin - bMin
    if (filters.sort === "price_desc") return bMin - aMin

    const gA = getGroupLabel(a)
    const gB = getGroupLabel(b)
    const c = gA.localeCompare(gB)
    if (c !== 0) return c
    return a.parent_code.localeCompare(b.parent_code)
  })

  if (filtered.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Package2 className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-4 text-lg font-semibold text-slate-900">No products found</h3>
        <p className="mt-2 text-sm text-slate-500">
          Try adjusting your filters or search terms to find what you&apos;re looking for.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <div className="col-span-3">Product Code</div>
        <div className="col-span-4">Product Name</div>
        <div className="col-span-2">Group</div>
        <div className="col-span-1 text-center">Stock</div>
        <div className="col-span-2 text-right">Price Range</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">
        {filtered.map((r) => {
          const status = computeStatus(r)
          const group = getGroupLabel(r)
          const stockLevel = r.total_stock ?? 0
          
          const price =
            r.min_price == null
              ? "—"
              : r.max_price != null && r.max_price !== r.min_price
                ? `₾${r.min_price}–₾${r.max_price}`
                : `₾${r.min_price}`

          return (
            <Link
              key={r.parent_code}
              href={`/${locale}/admin/products/${encodeURIComponent(r.parent_code)}`}
              className="group grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
            >
              <div className="col-span-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {r.parent_code}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <StatusPill status={status} />
                      <Hints r={r} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex items-center">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {r.name || "No name set"}
                  </div>
                  {!r.name && (
                    <div className="text-xs text-slate-500 mt-1">Product name missing</div>
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
                  <div className={`text-sm font-semibold ${
                    stockLevel > 10 ? 'text-emerald-600' : 
                    stockLevel > 0 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {stockLevel}
                  </div>
                  <div className="text-xs text-slate-500">
                    {stockLevel > 10 ? 'In stock' : stockLevel > 0 ? 'Low' : 'Out'}
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-end">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {price}
                  </div>
                  {r.min_price && (
                    <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                      <Coins className="h-3 w-3" />
                      Pricing set
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: "needs_work" | "hidden" | "live" }) {
  const configs = {
    live: {
      label: "Live",
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
    },
    hidden: {
      label: "Hidden", 
      icon: <EyeOff className="h-3 w-3" />,
      className: "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
    },
    needs_work: {
      label: "Needs Work",
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-red-100 text-red-700 ring-1 ring-red-200"
    }
  }

  const config = configs[status]

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  )
}

function Hints({
  r,
}: {
  r: Pick<AdminProductListRow, "has_content" | "has_photos" | "has_title" | "has_description">
}) {
  const issues = []
  if (!r.has_content) issues.push({ label: "No content", icon: <AlertTriangle className="h-3 w-3" /> })
  if (r.has_content && !r.has_photos) issues.push({ label: "No photos", icon: <Eye className="h-3 w-3" /> })
  if (r.has_content && !r.has_title) issues.push({ label: "No title", icon: <AlertTriangle className="h-3 w-3" /> })
  if (r.has_content && !r.has_description) issues.push({ label: "No description", icon: <AlertTriangle className="h-3 w-3" /> })

  if (issues.length === 0) return null

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
          +{issues.length - 2} more
        </span>
      )}
    </>
  )
}
