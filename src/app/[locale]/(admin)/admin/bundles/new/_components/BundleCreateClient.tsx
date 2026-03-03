"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { previewSizesAction, createBundleAction } from "../../actions";
import type { ParentOption } from "../../_queries/parents";
import { useTranslations } from "next-intl";
async function fetchParentOptions(
  locale: string,
  q: string,
): Promise<ParentOption[]> {
  const res = await fetch(
    `/${locale}/admin/bundles/new/parents?q=${encodeURIComponent(q)}`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error("Failed to load parents");
  return res.json();
}

export default function BundleCreateClient({ locale }: { locale: string }) {
  const [topQ, setTopQ] = useState("");
  const [bottomQ, setBottomQ] = useState("");
  const t = useTranslations("Admin.Bundles");
  const [topOptions, setTopOptions] = useState<ParentOption[]>([]);
  const [bottomOptions, setBottomOptions] = useState<ParentOption[]>([]);

  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");

  const [nameKa, setNameKa] = useState("");
  const [nameEn, setNameEn] = useState("");

  const [sizes, setSizes] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // load options with debounce-ish behavior
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      fetchParentOptions(locale, topQ || "X")
        .then((x) => alive && setTopOptions(x))
        .catch(() => alive && setTopOptions([]));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [locale, topQ]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      fetchParentOptions(locale, bottomQ || "X")
        .then((x) => alive && setBottomOptions(x))
        .catch(() => alive && setBottomOptions([]));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [locale, bottomQ]);

  // preview sizes when top/bottom changes
  useEffect(() => {
    setMsg(null);
    if (!top || !bottom || top === bottom) {
      setSizes([]);
      return;
    }
    startTransition(() => {
      previewSizesAction(locale, top, bottom)
        .then(setSizes)
        .catch((e) => setMsg(e?.message ?? "Preview failed"));
    });
  }, [locale, top, bottom]);

  const canSubmit = useMemo(() => {
    return !!top && !!bottom && top !== bottom && !!nameKa && !!nameEn;
  }, [top, bottom, nameKa, nameEn]);

  function onCreate() {
    setMsg(null);
    startTransition(() => {
      createBundleAction(locale, {
        top_parent_code: top,
        bottom_parent_code: bottom,
        name_ka: nameKa,
        name_en: nameEn,
      })
        .then((r) => setMsg(`Created: ${r.bundle_code}`))
        .catch((e) => setMsg(e?.message ?? "Create failed"));
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("createBundle")}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("topParent")}</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder={t("searchPlaceholder")}
            value={topQ}
            onChange={(e) => setTopQ(e.target.value)}
          />
          <select
            className="w-full border rounded-md p-2"
            value={top}
            onChange={(e) => setTop(e.target.value)}
          >
            <option value="">{t("selectTop")}</option>
            {topOptions.map((o) => (
              <option key={o.parent_code} value={o.parent_code}>
                {o.parent_code} {o.name ? `— ${o.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("bottomParent")}</label>
          <input
            className="w-full border rounded-md p-2"
            placeholder={t("searchPlaceholder")}
            value={bottomQ}
            onChange={(e) => setBottomQ(e.target.value)}
          />
          <select
            className="w-full border rounded-md p-2"
            value={bottom}
            onChange={(e) => setBottom(e.target.value)}
          >
            <option value="">{t("selectBottom")}</option>
            {bottomOptions.map((o) => (
              <option key={o.parent_code} value={o.parent_code}>
                {o.parent_code} {o.name ? `— ${o.name}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("nameKa")}</label>
          <input
            className="w-full border rounded-md p-2"
            value={nameKa}
            onChange={(e) => setNameKa(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("nameEn")}</label>
          <input
            className="w-full border rounded-md p-2"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md p-4 space-y-2">
        <div className="text-sm font-medium">{t("sizePreview")}</div>
        {top && bottom && top === bottom ? (
          <div className="text-sm text-red-600">
            {t("topandBottomCantBeSame")}
          </div>
        ) : sizes.length ? (
          <div className="text-sm">
            {t("availableSzies")}: {sizes.join(", ")}
          </div>
        ) : top && bottom ? (
          <div className="text-sm text-orange-600">
            {isPending ? "Checking…" : "No matching sizes (bundle won’t work)."}
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Select top and bottom to preview sizes.
          </div>
        )}
      </div>

      <button
        disabled={!canSubmit || isPending}
        onClick={onCreate}
        className="px-4 py-2 rounded-md border disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Create bundle"}
      </button>

      {msg ? <div className="text-sm ">{msg}</div> : null}
    </div>
  );
}
