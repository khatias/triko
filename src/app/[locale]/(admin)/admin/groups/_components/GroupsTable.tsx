"use client";

import React, { useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";
import {
  Loader2,
  Search,
  AlertCircle,
  Check,
  Save,
  Star,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AdminGroupRow } from "../_queries/fetchGroups";
import {
  upsertGroupSettingsAction,
  uploadFeaturedGroupImageAction,
} from "../actions";
import { useTranslations } from "next-intl";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const GROUPS_BUCKET = "groups";

function toPublicGroupImageUrl(path: string) {
  const p = (path ?? "").trim().replace(/^\/+/, "");
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${SUPABASE_URL}/storage/v1/object/public/${GROUPS_BUCKET}/${p}`;
}

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

  is_active: boolean;

  featured_home: boolean;
  featured_home_order: string;
  featured_home_image_path: string;
  featured_home_alt_en: string;
  featured_home_alt_ka: string;
};

function normalizeRow(g: AdminGroupRow): Editable {
  return {
    name_en: g.name_en ?? "",
    name_ka: g.name_ka ?? "",
    slug_en: g.slug_en ?? "",
    sort_order: g.sort_order == null ? "" : String(g.sort_order),
    is_visible: !!g.is_visible,

    is_active: g.is_active ?? true,

    featured_home: !!g.featured_home,
    featured_home_order:
      g.featured_home_order == null ? "" : String(g.featured_home_order),
    featured_home_image_path: (g.featured_home_image_path ?? "").trim(),
    featured_home_alt_en: (g.featured_home_alt_en ?? "").trim(),
    featured_home_alt_ka: (g.featured_home_alt_ka ?? "").trim(),
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

function parseIntOrNull(raw: string): number | null {
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
                <th className="px-4 py-3 font-medium min-w-30">{t("finaName")}</th>
                <th className="px-4 py-3 font-medium min-w-45">{t("nameEn")}</th>
                <th className="px-4 py-3 font-medium min-w-45">{t("nameKa")}</th>
                <th className="px-4 py-3 font-medium min-w-45">{t("slug")}</th>
                <th className="px-4 py-3 font-medium text-right w-24">
                  {t("sortOrder")}
                </th>
                <th className="px-4 py-3 font-medium text-right min-w-30">
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
  const t = useTranslations("Admin.groups");

  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false); // New state for better UI layout

  const [form, setForm] = useState<Editable>(() => normalizeRow(g));
  const [saved, setSaved] = useState<Editable>(() => normalizeRow(g));

  const [slugError, setSlugError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const successTimer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const clearSuccessTimer = () => {
    if (successTimer.current) window.clearTimeout(successTimer.current);
    successTimer.current = null;
  };

  const changed =
    form.name_en !== saved.name_en ||
    form.name_ka !== saved.name_ka ||
    normalizeSlug(form.slug_en) !== normalizeSlug(saved.slug_en) ||
    form.sort_order.trim() !== saved.sort_order.trim() ||
    form.is_visible !== saved.is_visible ||
    form.is_active !== saved.is_active ||
    form.featured_home !== saved.featured_home ||
    form.featured_home_order.trim() !== saved.featured_home_order.trim() ||
    form.featured_home_image_path.trim() !==
      saved.featured_home_image_path.trim() ||
    form.featured_home_alt_en.trim() !== saved.featured_home_alt_en.trim() ||
    form.featured_home_alt_ka.trim() !== saved.featured_home_alt_ka.trim();

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
    const featured_home_order = parseIntOrNull(nextForm.featured_home_order);

    return {
      locale,
      groupId: g.group_id,

      name_en,
      name_ka,
      slug_en,
      sort_order,
      is_visible: nextForm.is_visible,

      is_active: nextForm.is_active,

      featured_home: nextForm.featured_home,
      featured_home_order,
      featured_home_image_path: nextForm.featured_home_image_path.trim(),
      featured_home_alt_en: nextForm.featured_home_alt_en.trim(),
      featured_home_alt_ka: nextForm.featured_home_alt_ka.trim(),
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
        featured_home_order: nextForm.featured_home_order.trim(),
        featured_home_image_path: nextForm.featured_home_image_path.trim(),
        featured_home_alt_en: nextForm.featured_home_alt_en.trim(),
        featured_home_alt_ka: nextForm.featured_home_alt_ka.trim(),
      });

      setForm((p) => ({
        ...p,
        slug_en: normalizeSlug(p.slug_en),
        name_en: p.name_en.trim(),
        name_ka: p.name_ka.trim(),
        sort_order: p.sort_order.trim(),
        featured_home_order: p.featured_home_order.trim(),
        featured_home_image_path: p.featured_home_image_path.trim(),
        featured_home_alt_en: p.featured_home_alt_en.trim(),
        featured_home_alt_ka: p.featured_home_alt_ka.trim(),
      }));

      setSaveStatus("success");
      clearSuccessTimer();
      successTimer.current = window.setTimeout(() => setSaveStatus("idle"), 2500);
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
      successTimer.current = window.setTimeout(() => setSaveStatus("idle"), 2000);
    });
  };

  const uploadFeaturedImage = async (file: File) => {
    setUploading(true);
    setServerError(null);
    setSaveStatus("idle");

    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("groupId", String(g.group_id));
    fd.set("file", file);

    const res = await uploadFeaturedGroupImageAction(fd);

    setUploading(false);

    if (!res.success) {
      setServerError(res.message || "Upload failed");
      return;
    }

    setForm((p) => ({
      ...p,
      featured_home_image_path: res.path,
      featured_home: true,
    }));
  };

  const previewUrl = toPublicGroupImageUrl(form.featured_home_image_path);

  return (
    <React.Fragment>
      <tr
        className={[
          "align-top group transition-colors",
          form.featured_home && !expanded
            ? "bg-amber-50/40 hover:bg-amber-50/60 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
            : expanded 
              ? "bg-zinc-50 dark:bg-zinc-900/40 border-b-0" 
              : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
        ].join(" ")}
      >
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
          <div className="mt-1 flex flex-col gap-2">
            <div className="text-[10px] text-zinc-400 font-mono">ID: {g.group_id}</div>
            <label className="inline-flex items-center gap-2 text-[11px] font-semibold w-max">
              <input
                type="checkbox"
                checked={form.is_active}
                disabled={pending}
                onChange={(e) => {
                  setForm((p) => ({ ...p, is_active: e.target.checked }));
                  setSaveStatus("idle");
                  setServerError(null);
                }}
              />
              <span
                className={[
                  "rounded-full px-2 py-1 text-[10px] font-bold",
                  form.is_active
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
                ].join(" ")}
              >
                {form.is_active ? t("active") : t("inactive")}
              </span>
            </label>
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
              <div className="mt-1 text-[10px] text-zinc-500 truncate" title={normalizeSlug(form.slug_en)}>
                {a("normalized")}:{" "}
                <span className="font-mono">{normalizeSlug(form.slug_en)}</span>
              </div>
            )}
            {slugError && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-rose-600">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span className="truncate" title={slugError}>{slugError}</span>
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
            className="text-center w-16 ml-auto"
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
                <Check className="h-3 w-3" />
              </span>
            ) : null}
            
            {/* Expand / Collapse Settings Button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              title={t("featuredTitle")}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {serverError && (
            <div className="text-[10px] text-rose-600 text-right mt-1 font-medium">
              {serverError}
            </div>
          )}
        </td>
      </tr>

      {/* Expanded Featured Settings Row */}
      {expanded && (
        <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-t-0">
          <td colSpan={7} className="px-4 pb-4 pt-1">
            <div
              className={[
                "rounded-xl border p-4 transition",
                form.featured_home
                  ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
              ].join(" ")}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
                      form.featured_home
                        ? "bg-amber-200 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
                    ].join(" ")}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {t("featuredTitle")}
                  </div>

                  {form.featured_home && (
                    <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[12px] font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-300"
                      checked={form.featured_home}
                      disabled={pending}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, featured_home: e.target.checked }));
                        setSaveStatus("idle");
                        setServerError(null);
                      }}
                    />
                    {t("featuredEnable")}
                  </label>

                  <div className="flex items-center gap-2 border-l border-zinc-300 dark:border-zinc-700 pl-4">
                    <span className="text-[12px] text-zinc-500 font-medium">
                      {t("featuredOrder")}
                    </span>
                    <input
                      className="h-8 w-16 rounded-md border border-zinc-200 bg-white px-2 text-center text-xs dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400 outline-none"
                      placeholder="1"
                      value={form.featured_home_order}
                      disabled={pending || !form.featured_home}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          featured_home_order: e.target.value,
                        }));
                        setSaveStatus("idle");
                        setServerError(null);
                      }}
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-[160px_1fr]">
                <div className="w-full">
                  <div className="text-[11px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
                    {t("featuredPreview")}
                  </div>
                  <div className="h-28.5 w-40 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[11px] text-zinc-400 p-2 text-center">
                        {t("featuredNoImage")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={pending || uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await uploadFeaturedImage(file);
                      }}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={pending || uploading}
                      onClick={() => fileRef.current?.click()}
                      className={[
                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition",
                        "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 shadow-sm",
                        uploading ? "opacity-60 cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      <Upload className="h-4 w-4" />
                      {form.featured_home_image_path?.trim()
                        ? t("featuredReplace")
                        : t("featuredUpload")}
                    </button>

                    {form.featured_home_image_path?.trim() ? (
                      <>
                        <button
                          type="button"
                          disabled={pending || uploading}
                          onClick={() => {
                            setForm((p) => ({
                              ...p,
                              featured_home_image_path: "",
                            }));
                            setSaveStatus("idle");
                            setServerError(null);
                          }}
                          className="inline-flex items-center rounded-lg border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 bg-white hover:bg-rose-50 dark:border-rose-900 dark:bg-transparent dark:text-rose-400 dark:hover:bg-rose-950/50 shadow-sm"
                        >
                          {t("featuredClear")}
                        </button>

                        {previewUrl ? (
                          <a
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("featuredOpen")}
                          </a>
                        ) : null}
                      </>
                    ) : null}

                    {uploading ? (
                      <span className="inline-flex items-center gap-2 text-sm text-zinc-500 font-medium ml-2">
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        {t("featuredUploading")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400 outline-none transition-colors"
                      placeholder={t("featuredAltEn")}
                      value={form.featured_home_alt_en}
                      disabled={pending}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          featured_home_alt_en: e.target.value,
                        }));
                        setSaveStatus("idle");
                        setServerError(null);
                      }}
                    />
                    <input
                      className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950 focus:border-zinc-400 outline-none transition-colors"
                      placeholder={t("featuredAltKa")}
                      value={form.featured_home_alt_ka}
                      disabled={pending}
                      onChange={(e) => {
                        setForm((p) => ({
                          ...p,
                          featured_home_alt_ka: e.target.value,
                        }));
                        setSaveStatus("idle");
                        setServerError(null);
                      }}
                    />
                  </div>

                  {form.featured_home_image_path?.trim() ? (
                    <div className="mt-3 text-[11px] text-zinc-500 break-all bg-zinc-100 dark:bg-zinc-900 p-2 rounded-md">
                      <span className="font-semibold">{t("featuredPath")}:</span>{" "}
                      <span className="font-mono text-zinc-600 dark:text-zinc-400">
                        {form.featured_home_image_path}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 text-[11px] text-zinc-400 font-medium">
                      {t("featuredNoImageHint")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
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
      title={value} // Added so full text is visible on hover when overflowed
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className={[
        "h-9 w-full rounded-lg border px-2 text-sm outline-none transition focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800",
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