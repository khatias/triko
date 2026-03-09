"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  upsertFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
} from "../actions";

type Row = {
  id: string;
  key: string;
  parent_code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  locale: "en" | "ka";
  initialKey: string;
  initialRows: Row[];
};

function parseIntOr0(v: string) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

export default function FeaturedProductsEditor({
 
  initialKey,
  initialRows,
}: Props) {
  const t = useTranslations("Admin.site");
  const a = useTranslations("Admin.actions");

  const [, startTransition] = useTransition();

  const [rows, setRows] = useState<Row[]>(() => initialRows);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const [addParent, setAddParent] = useState("");
  const [addOrder, setAddOrder] = useState("0");
  const [addActive, setAddActive] = useState(true);

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  // ✅ per-action loading (not global)
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!query) return rows;
    return rows.filter((r) =>
      `${r.parent_code} ${r.sort_order}`.toLowerCase().includes(query),
    );
  }, [rows, query]);

  const add = () => {
    setErr(null);
    setStatus("idle");

    const parent_code = addParent.trim();
    if (!parent_code) {
      setErr("parent_code is required");
      setStatus("error");
      return;
    }

    setAdding(true);

    startTransition(async () => {
      try {
        const res = await upsertFeaturedProduct({
          key: initialKey,
          parent_code,
          sort_order: parseIntOr0(addOrder),
          is_active: !!addActive,
        });

        if (!res?.success) {
          setErr(res?.message || "Error saving");
          setStatus("error");
          return;
        }

        // optimistic add (avoid duplicates)
        setRows((p) => {
          const exists = p.some(
            (x) => x.key === initialKey && x.parent_code === parent_code,
          );
          if (exists) return p;

          return [...p, {
            id: `temp-${crypto.randomUUID()}`,
            key: initialKey,
            parent_code,
            sort_order: parseIntOr0(addOrder),
            is_active: !!addActive,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }].sort((a, b) => a.sort_order - b.sort_order);
        });

        setAddParent("");
        setAddOrder("0");
        setAddActive(true);

        setStatus("success");
        setTimeout(() => setStatus("idle"), 1500);
      } finally {
        setAdding(false);
      }
    });
  };

  const saveRow = (r: Row) => {
    setErr(null);
    setStatus("idle");
    setSavingId(r.id);

    startTransition(async () => {
      try {
        const res = String(r.id).startsWith("temp-")
          ? await upsertFeaturedProduct({
              key: r.key,
              parent_code: r.parent_code,
              sort_order: r.sort_order,
              is_active: r.is_active,
            })
          : await updateFeaturedProduct({
              id: r.id,
              sort_order: r.sort_order,
              is_active: r.is_active,
            });

        if (!res?.success) {
          setErr(res?.message || "Error saving");
          setStatus("error");
          return;
        }

        setStatus("success");
        setTimeout(() => setStatus("idle"), 1200);
      } finally {
        setSavingId((cur) => (cur === r.id ? null : cur));
      }
    });
  };

  const del = (r: Row) => {
    setErr(null);
    setStatus("idle");

    // local-only delete for temp row
    if (String(r.id).startsWith("temp-")) {
      setRows((p) => p.filter((x) => x.id !== r.id));
      return;
    }

    setDeletingId(r.id);

    startTransition(async () => {
      try {
        const res = await deleteFeaturedProduct({ id: r.id });

        if (!res?.success) {
          setErr(res?.message || "Delete failed");
          setStatus("error");
          return;
        }

        setRows((p) => p.filter((x) => x.id !== r.id));

        setStatus("success");
        setTimeout(() => setStatus("idle"), 1200);
      } finally {
        setDeletingId((cur) => (cur === r.id ? null : cur));
      }
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t("featuredProductsTitle")}
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {t("featuredProductsDesc")}
          </div>
        </div>

        <div className="text-xs text-zinc-500">
          {t("total")}{" "}
          <span className="font-bold text-zinc-900 dark:text-zinc-50">
            {rows.length}
          </span>
        </div>
      </div>

      {/* Add */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_120px_120px]">
        <input
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder={t("featuredProductsAddPlaceholder")}
          value={addParent}
          onChange={(e) => setAddParent(e.target.value)}
          disabled={adding}
        />

        <input
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="0"
          inputMode="numeric"
          value={addOrder}
          onChange={(e) => setAddOrder(e.target.value)}
          disabled={adding}
        />

        <label className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold flex items-center gap-2 dark:border-zinc-800 dark:bg-zinc-950">
          <input
            type="checkbox"
            checked={addActive}
            onChange={(e) => setAddActive(e.target.checked)}
            disabled={adding}
          />
          {t("active")}
        </label>

        <button
          type="button"
          onClick={add}
          disabled={adding}
          className="h-10 rounded-lg bg-zinc-900 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {t("add")}
        </button>
      </div>

      {/* Search */}
      <div className="mt-4">
        <input
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
          placeholder={t("searchLabel")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 font-semibold">parent_code</th>
              <th className="px-4 py-3 font-semibold w-28 text-right">
                {t("featuredOrder")}
              </th>
              <th className="px-4 py-3 font-semibold w-24 text-center">
                {t("active")}
              </th>
              <th className="px-4 py-3 font-semibold w-40 text-right">
                {t("actions")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.map((r) => {
              const isSaving = savingId === r.id;
              const isDeleting = deletingId === r.id;

              return (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {r.parent_code}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {r.id}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <input
                      className="h-9 w-24 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-right outline-none dark:border-zinc-800 dark:bg-zinc-950"
                      value={r.sort_order}
                      inputMode="numeric"
                      disabled={isSaving || isDeleting}
                      onChange={(e) =>
                        setRows((p) =>
                          p.map((x) =>
                            x.id === r.id
                              ? { ...x, sort_order: parseIntOr0(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={r.is_active}
                      disabled={isSaving || isDeleting}
                      onChange={(e) =>
                        setRows((p) =>
                          p.map((x) =>
                            x.id === r.id ? { ...x, is_active: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSaving || isDeleting}
                        onClick={() => saveRow(r)}
                        className="h-9 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                        title={a("save")}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={isSaving || isDeleting}
                        onClick={() => del(r)}
                        className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-zinc-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filtered.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  {t("noItems")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Status */}
      <div className="mt-3 min-h-4.5 text-xs">
        {err ? (
          <span className="text-rose-600 font-semibold">{err}</span>
        ) : status === "success" ? (
          <span className="inline-flex items-center gap-2 text-emerald-700 font-bold">
            <Check className="h-4 w-4" />
            {a("saved")}
          </span>
        ) : null}
      </div>
    </div>
  );
}