"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { Loader2, Search, AlertCircle, Check, Save } from "lucide-react";
import type { AdminGroupRow } from "../_queries/fetchGroups";
import { upsertGroupSettingsAction } from "../actions";
import { useTranslations } from "next-intl";

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
  message: "Lowercase letters, numbers & dashes only (e.g. mens-shoes)",
});

type Props = {
  locale: string;
  groups: AdminGroupRow[];
};

type Editable = {
  name_en: string;
  name_ka: string;
  slug_en: string;
  sort_order: string;
  is_visible: boolean;
};

function normalizeRow(g: AdminGroupRow): Editable {
  return {
    name_en: g.name_en ?? "",
    name_ka: g.name_ka ?? "",
    slug_en: g.slug_en ?? "",
    sort_order: g.sort_order == null ? "" : String(g.sort_order),
    is_visible: !!g.is_visible,
  };
}
function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSort(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export default function GroupsTable({ locale, groups }: Props) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const t = useTranslations("Admin.groups");

  const filtered = useMemo(() => {
    if (!query) return groups;
    return groups.filter((g) => {
      const hay =
        `${g.fina_name} ${g.name_en ?? ""} ${g.slug_en ?? ""} ${g.group_id}`.toLowerCase();
      return hay.includes(query);
    });
  }, [groups, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            placeholder={t("searchLabel")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-900/50">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium w-16">{t("visible")}</th>
                <th className="px-4 py-3 font-medium">{t("finaName")}</th>
                <th className="px-4 py-3 font-medium">{t("nameEn")}</th>
                <th className="px-4 py-3 font-medium">{t("nameKa")}</th>
                <th className="px-4 py-3 font-medium w-64">{t("slug")}</th>
                <th className="px-4 py-3 font-medium text-right w-20">
                  {t("sortOrder")}
                </th>
                <th className="px-4 py-3 font-medium text-right w-24">
                  {t("actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.map((g) => (
                <Row key={g.group_id} locale={locale} g={g} />
              ))}
              {!filtered.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    {t("noGroups")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Row Component ---

function Row({ locale, g }: { locale: string; g: AdminGroupRow }) {
  const a = useTranslations("Admin.actions");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Editable>(() => normalizeRow(g));

  // ✅ snapshot of "server truth" for changed calculation
  const [saved, setSaved] = useState<Editable>(() => normalizeRow(g));

  const [slugError, setSlugError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const successTimer = useRef<number | null>(null);
  const clearSuccessTimer = () => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = null;
  };

  const changed =
    form.name_en !== saved.name_en ||
    form.name_ka !== saved.name_ka ||
    normalizeSlug(form.slug_en) !== normalizeSlug(saved.slug_en) ||
    form.sort_order.trim() !== saved.sort_order.trim() ||
    form.is_visible !== saved.is_visible;

  function validateSlug(raw: string) {
    const cleaned = normalizeSlug(raw);
    if (!raw.trim()) return { ok: true as const, cleaned: "" };
    const result = slugSchema.safeParse(cleaned);
    if (!result.success)
      return {
        ok: false as const,
        cleaned,
        message: result.error.issues[0]?.message ?? "Invalid slug",
      };
    return { ok: true as const, cleaned };
  }

  const handleSlugChange = (val: string) => {
    setForm((p) => ({ ...p, slug_en: val }));
    setSaveStatus("idle");
    setServerError(null);

    const v = validateSlug(val);
    setSlugError(v.ok ? null : v.message);
  };

  function buildPayload(nextForm: Editable) {
    const name_en = nextForm.name_en.trim();
    const name_ka = nextForm.name_ka.trim();

    const normalized = normalizeSlug(nextForm.slug_en);
    const slug_en = normalized ? normalized : "";

    const sort_order = parseSort(nextForm.sort_order);

    return {
      locale,
      groupId: g.group_id,
      name_en,
      name_ka,
      slug_en,
      sort_order,
      is_visible: nextForm.is_visible,
    };
  }

  const save = () => {
    const v = validateSlug(form.slug_en);
    if (!v.ok) {
      setSlugError(v.message);
      return;
    }

    setServerError(null);
    setSaveStatus("idle");

    const nextForm: Editable = {
      ...form,
      slug_en: v.cleaned ? v.cleaned : form.slug_en,
    };

    startTransition(async () => {
      const res = await upsertGroupSettingsAction(buildPayload(nextForm));

      if (!res.success) {
        setSaveStatus("error");
        setServerError(res.message || "Error saving");
        return;
      }

      setSaved({
        ...nextForm,
        slug_en: normalizeSlug(nextForm.slug_en),
        sort_order: nextForm.sort_order.trim(),
        name_en: nextForm.name_en.trim(),
        name_ka: nextForm.name_ka.trim(),
      });

      setForm((p) => ({
        ...p,
        slug_en: normalizeSlug(p.slug_en),
        name_en: p.name_en.trim(),
        name_ka: p.name_ka.trim(),
        sort_order: p.sort_order.trim(),
      }));

      setSaveStatus("success");
      clearSuccessTimer();
      successTimer.current = window.setTimeout(
        () => setSaveStatus("idle"),
        2500,
      );
    });
  };

  const saveToggle = (nextVisible: boolean) => {
    setServerError(null);
    setSaveStatus("idle");

    const nextForm: Editable = { ...form, is_visible: nextVisible };
    setForm(nextForm);

    startTransition(async () => {
      const res = await upsertGroupSettingsAction(buildPayload(nextForm));
      if (!res.success) {
        setSaveStatus("error");
        setServerError(res.message || "Error saving");
        setForm((p) => ({ ...p, is_visible: !nextVisible }));
        return;
      }
      setSaved((s) => ({ ...s, is_visible: nextVisible }));
      setSaveStatus("success");
      clearSuccessTimer();
      successTimer.current = window.setTimeout(
        () => setSaveStatus("idle"),
        2000,
      );
    });
  };

  return (
    <tr className="align-top group hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
      <td className="px-4 py-3">
        <Toggle
          value={form.is_visible}
          disabled={pending}
          onChange={(v) => saveToggle(v)}
        />
      </td>

      <td className="px-4 py-3">
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {g.fina_name}
        </div>
        <div className="text-[10px] text-zinc-400 font-mono">
          ID: {g.group_id}
        </div>
      </td>

      <td className="px-4 py-3">
        <InlineInput
          value={form.name_en}
          disabled={pending}
          onChange={(v) => {
            setForm((p) => ({ ...p, name_en: v }));
            setSaveStatus("idle");
            setServerError(null);
          }}
        />
      </td>

      <td className="px-4 py-3">
        <InlineInput
          value={form.name_ka}
          disabled={pending}
          onChange={(v) => {
            setForm((p) => ({ ...p, name_ka: v }));
            setSaveStatus("idle");
            setServerError(null);
          }}
        />
      </td>

      <td className="px-4 py-3">
        <div className="relative">
          <InlineInput
            value={form.slug_en}
            disabled={pending}
            onChange={handleSlugChange}
            placeholder="e.g. boxers"
            isError={!!slugError}
            className="font-mono text-xs"
          />
          {form.slug_en.trim() && !slugError && (
            <div className="mt-1 text-[10px] text-zinc-500">
              {a("normalized")}:{" "}
              <span className="font-mono">{normalizeSlug(form.slug_en)}</span>
            </div>
          )}
          {slugError && (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
              <AlertCircle className="h-3 w-3" />
              {slugError}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-right">
        <InlineInput
          value={form.sort_order}
          disabled={pending}
          onChange={(v) => {
            setForm((p) => ({ ...p, sort_order: v }));
            setSaveStatus("idle");
            setServerError(null);
          }}
          inputMode="numeric"
          className="text-center"
        />
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end h-9 gap-2">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : changed ? (
            <button
              type="button"
              disabled={!!slugError}
              onClick={save}
              className="flex items-center gap-1.5 h-8 rounded-lg bg-zinc-900 px-3 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Save className="h-3 w-3" />
              {a("save")}
            </button>
          ) : saveStatus === "success" ? (
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-950/30 dark:text-emerald-300">
              <Check className="h-3 w-3" /> {a("saved")}
            </span>
          ) : null}
        </div>

        {serverError && (
          <div className="text-[10px] text-rose-600 text-right mt-1 font-medium">
            {serverError}
          </div>
        )}
      </td>
    </tr>
  );
}

// --- Inputs ---

function InlineInput({
  value,
  onChange,
  disabled,
  placeholder,
  inputMode,
  className,
  isError,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  isError?: boolean;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className={[
        "h-9 w-full rounded-lg border px-2 text-sm outline-none transition",
        isError
          ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 placeholder:text-rose-300"
          : "border-zinc-200 bg-white text-zinc-900 focus:border-zinc-400 placeholder:text-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
        className ?? "",
      ].join(" ")}
    />
  );
}

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={[
        "relative inline-flex h-5 w-9 items-center rounded-full border transition-colors",
        value
          ? "bg-emerald-500 border-emerald-500"
          : "bg-zinc-200 border-zinc-200 dark:bg-zinc-700 dark:border-zinc-700",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:opacity-90",
      ].join(" ")}
      aria-pressed={value}
    >
      <span
        className={[
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          value ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}
