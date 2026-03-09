"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { updateTopBanner } from "../actions";
import { useTranslations } from "next-intl";
const formSchema = z.object({
  key: z.literal("top_banner"),
  is_active: z.boolean(),

  en_text: z.string().trim().min(1, "English text is required").max(200),
  ka_text: z.string().trim().min(1, "Georgian text is required").max(200),

  cta_href: z.string().trim().min(1, "CTA link is required").max(300),

  cta_label_en: z
    .string()
    .trim()
    .min(1, "English CTA label is required")
    .max(40),
  cta_label_ka: z
    .string()
    .trim()
    .min(1, "Georgian CTA label is required")
    .max(40),
});

type FormValues = z.infer<typeof formSchema>;

type BannerRow = {
  key: "top_banner";
  is_active: boolean;
  en_text: string;
  ka_text: string;
  cta_href: string | null;
  cta_label_en: string | null;
  cta_label_ka: string | null;
};

export default function BannerEditor({
  locale,
  initialBanner,
}: {
  locale: "en" | "ka";
  initialBanner: BannerRow;
}) {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState<null | "ok">(null);
  const [err, setErr] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialBanner,
      cta_href: initialBanner.cta_href ?? "/products",
      cta_label_en: initialBanner.cta_label_en ?? "Shop Now",
      cta_label_ka: initialBanner.cta_label_ka ?? "დაათვალიერე",
    },
    mode: "onChange",
  });

  const isActive = watch("is_active");
  const previewText = locale === "ka" ? watch("ka_text") : watch("en_text");
  const previewCta =
    locale === "ka" ? watch("cta_label_ka") : watch("cta_label_en");
  const previewHref = watch("cta_href");
  const t = useTranslations("Admin.site");
  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    setSaved(null);
    setErr(null);
    try {
      await updateTopBanner(values);
      setSaved("ok");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(null), 1500);
    }
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {t("banner")}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{t("bannerHint")}</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4"
            {...register("is_active")}
          />
          {t("active")}
        </label>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <input type="hidden" {...register("key")} />

        <div>
          <label className="block text-sm font-medium text-slate-800">
            {t("english")}
          </label>
          <input
            {...register("en_text")}
            className={clsx(
              "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none",
              errors.en_text
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:ring-2 focus:ring-slate-200",
            )}
            placeholder="Limited Time: 15% Off Boxers"
          />
          {errors.en_text?.message ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.en_text.message}
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800">
            {t("georgian")}
          </label>
          <input
            {...register("ka_text")}
            className={clsx(
              "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none",
              errors.ka_text
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:ring-2 focus:ring-slate-200",
            )}
            placeholder="შეზღუდული დროით: 15% ფასდაკლება ბოქსერებზე"
          />
          {errors.ka_text?.message ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.ka_text.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-800">
              {t("ctaLabelEN")}
            </label>
            <input
              {...register("cta_label_en")}
              className={clsx(
                "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none",
                errors.cta_label_en
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:ring-2 focus:ring-slate-200",
              )}
              placeholder="Shop Now"
            />
            {errors.cta_label_en?.message ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.cta_label_en.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800">
              {t("ctaLabelKA")}
            </label>
            <input
              {...register("cta_label_ka")}
              className={clsx(
                "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none",
                errors.cta_label_ka
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:ring-2 focus:ring-slate-200",
              )}
              placeholder="დაათვალიერე"
            />
            {errors.cta_label_ka?.message ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.cta_label_ka.message}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800">
            {t("ctaURL")}
          </label>
          <input
            {...register("cta_href")}
            className={clsx(
              "mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none",
              errors.cta_href
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:ring-2 focus:ring-slate-200",
            )}
            placeholder="/products"
          />
          {errors.cta_href?.message ? (
            <p className="mt-1 text-xs text-red-600">
              {errors.cta_href.message}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">{t("usePath")}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-500">PREVIEW</div>
          {isActive ? (
            <div className="mt-2 w-full bg-[#fcf5e8] py-2 text-center">
              <p className="text-[#43423E] text-[11px] font-black tracking-tight flex items-center justify-center gap-2">
                {previewText}
                <span className="text-[#FF5C5C]">{previewCta}</span>
              </p>
              <div className="mt-1 text-[10px] text-slate-500">
                Link: {previewHref}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Banner is disabled.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold",
              saving || !isDirty
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-orange-500 text-white hover:bg-orange-600",
            )}
          >
            {saving ? t("saving") : t("save")}
          </button>

          {saved === "ok" ? (
            <span className="text-sm font-medium text-green-600">
              {t("saved")}
            </span>
          ) : null}

          {err ? <span className="text-sm text-red-600">{err}</span> : null}
        </div>
      </form>
    </div>
  );
}
