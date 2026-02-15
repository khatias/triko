// src/app/[locale]/(shop)/checkout/_components/CheckoutFormClient.tsx
"use client";

import { useTranslations } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Check,
  ShoppingBag,
  MapPin,
  Truck,
  AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createPendingOrder,
  type CreateOrderInput,
  type OutOfStockItem,
  type OutOfStockReason,
} from "../actions/createPendingOrder";

import {
  setShippingZoneAction,
  type ShippingZone,
} from "../actions/setShippingZone";

import type {
  AddressRow,
  CartItemRow,
  ProfileInfo,
  SummaryInfo,
} from "../page";
import { hasImg, toNumber } from "@/utils/type-guards";
import { formatPrice } from "@/lib/helpers";
import {
  addressSchema,
  fullNameSchema,
  makeGeorgiaPhoneSchema,
} from "@/lib/validation/profile";
import { InputField } from "@/components/form/Field";

/* helpers */

function itemTitle(item: CartItemRow, locale: string) {
  const localized = locale === "ka" ? item.title_ka : item.title_en;
  return (localized?.trim() || item.product_name || "Product").trim();
}

function money(v: number | null, currency: string | null): string | null {
  if (v == null) return null;
  return formatPrice(v, currency);
}

function reasonKey(r: OutOfStockReason) {
  if (r === "reserved_temporarily") return "oos_reserved_temporarily";
  if (r === "no_stock") return "oos_no_stock";
  return "oos_insufficient";
}

const bogInitSchema = z.object({
  redirectUrl: z.string().min(1),
});

async function initBogPayment(
  orderId: string,
  locale: string,
): Promise<string | null> {
  const res = await fetch("/api/bog/create-order-for-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, locale }),
  });

  const json: unknown = await res.json().catch(() => null);
  const parsed = bogInitSchema.safeParse(json);

  if (!res.ok || !parsed.success) return null;
  return parsed.data.redirectUrl;
}

/* schema */

const shippingZoneSchema = z.enum(["tbilisi", "region_city", "region_village"]);

function makeCheckoutSchema(tErr: (k: string) => string) {
  const phone = makeGeorgiaPhoneSchema({
    t: tErr,
    output: "e164",
    allowLandline: false,
  });

  const fullName = fullNameSchema(tErr);
  const addr = addressSchema(tErr);

  return z
    .object({
      fullName,
      phone,
      useSaved: z.boolean(),
      selectedAddrId: z.string(),
      shippingZone: shippingZoneSchema,
      line1: z.string(),
      line2: z.string(),
      city: z.string(),
    })
    .superRefine((val, ctx) => {
      if (val.useSaved) {
        if (!val.selectedAddrId.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["selectedAddrId"],
            message: tErr("addressSelectionRequired"),
          });
        }
        return;
      }

      const r = addr.safeParse({
        line1: val.line1,
        line2: val.line2,
        city: val.city,
        region: "",
      });

      if (!r.success) {
        const flat = r.error.flatten().fieldErrors;

        if (flat.line1?.[0]) {
          ctx.addIssue({
            code: "custom",
            path: ["line1"],
            message: flat.line1[0],
          });
        }
        if (flat.city?.[0]) {
          ctx.addIssue({
            code: "custom",
            path: ["city"],
            message: flat.city[0],
          });
        }
      }
    });
}

type CheckoutValues = z.infer<ReturnType<typeof makeCheckoutSchema>>;
type TValues = Record<string, string | number>;

type Props = {
  locale: string;
  savedAddresses: AddressRow[];
  cartItems: CartItemRow[];
  profileInfo: ProfileInfo;
  summary: SummaryInfo;
};

export default function CheckoutFormClient({
  locale,
  savedAddresses,
  cartItems,
  profileInfo,
  summary,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Checkout");
  const eIntl = useTranslations("Errors");

  const e = useCallback((k: string) => eIntl(k as never), [eIntl]);
  const eVars = useCallback(
    (k: string, values: TValues) => eIntl(k as never, values as never),
    [eIntl],
  );

  const schema = useMemo(() => makeCheckoutSchema(e), [e]);

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [oosItems, setOosItems] = useState<OutOfStockItem[] | null>(null);
  const [liveSummary, setLiveSummary] = useState<SummaryInfo>(summary);
  const [shippingUpdating, setShippingUpdating] = useState(false);

  const clearBanner = useCallback(() => {
    setBannerError(null);
    setOosItems(null);
  }, []);

  const cartIsEmpty = cartItems.length === 0;

  useEffect(() => {
    if (cartIsEmpty) router.replace(`/${locale}/cart`);
  }, [cartIsEmpty, locale, router]);

  const canUseSaved = savedAddresses.length > 0;
  const firstAddrId = savedAddresses[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting, isValid, dirtyFields, isSubmitted },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: profileInfo.full_name ?? "",
      phone: profileInfo.phone ?? "",
      useSaved: canUseSaved,
      selectedAddrId: firstAddrId,
      shippingZone: "tbilisi",
      line1: "",
      line2: "",
      city: "",
    },
  });

  const useSavedRaw = watch("useSaved");
  const selectedAddrId = watch("selectedAddrId");
  const shippingZone = watch("shippingZone") as ShippingZone;
  const useSaved = canUseSaved && useSavedRaw;

  useEffect(() => {
    if (!canUseSaved) {
      if (useSavedRaw) {
        setValue("useSaved", false, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      if (selectedAddrId) {
        setValue("selectedAddrId", "", {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
      return;
    }

    if (useSaved) {
      const exists = savedAddresses.some((a) => a.id === selectedAddrId);
      if (!exists) {
        setValue("selectedAddrId", firstAddrId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [
    canUseSaved,
    useSaved,
    useSavedRaw,
    selectedAddrId,
    savedAddresses,
    setValue,
    firstAddrId,
  ]);

  const showErr = (name: keyof CheckoutValues) =>
    Boolean(errors[name]?.message) &&
    (Boolean(dirtyFields[name]) || isSubmitted);

  function oosTitleFor(item: OutOfStockItem) {
    const title =
      locale === "ka"
        ? (item.title_ka ?? item.product_name)
        : (item.title_en ?? item.product_name);
    return (title ?? "Product").trim();
  }

  const regFullName = register("fullName", { onChange: clearBanner });
  const regPhone = register("phone", { onChange: clearBanner });
  const regLine1 = register("line1", { onChange: clearBanner });
  const regLine2 = register("line2", { onChange: clearBanner });
  const regCity = register("city", { onChange: clearBanner });

  const { ref: shippingRef, name: shippingName } = register("shippingZone");
  const toggleAddressMode = useCallback(() => {
    clearBanner();
    if (!canUseSaved) return;

    const next = !useSavedRaw;
    setValue("useSaved", next, { shouldValidate: true, shouldDirty: true });

    if (next) {
      const exists = savedAddresses.some((a) => a.id === selectedAddrId);
      if (!exists) {
        setValue("selectedAddrId", firstAddrId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    } else {
      setValue("selectedAddrId", "", {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [
    clearBanner,
    canUseSaved,
    useSavedRaw,
    setValue,
    savedAddresses,
    selectedAddrId,
    firstAddrId,
  ]);

  const applyZone = useCallback(
    async (zone: ShippingZone) => {
      clearBanner();
      setShippingUpdating(true);
      const r = await setShippingZoneAction(locale, zone);
      setShippingUpdating(false);

      if (!r.ok) {
        setBannerError("Shipping update failed");
        return;
      }

      setLiveSummary(r.summary);
      router.refresh();
    },
    [clearBanner, locale, router],
  );

  const onSubmit = handleSubmit(async (values) => {
    clearBanner();

    if (values.shippingZone) {
      await applyZone(values.shippingZone as ShippingZone);
    }

    const normalizedUseSaved = canUseSaved && values.useSaved;

    if (normalizedUseSaved) {
      const exists = savedAddresses.some((a) => a.id === values.selectedAddrId);
      if (!exists) {
        setError("selectedAddrId", {
          type: "validate",
          message: e("addressSelectionRequired"),
        });
        return;
      }
    }

    const addr = normalizedUseSaved
      ? (savedAddresses.find((a) => a.id === values.selectedAddrId) ?? null)
      : null;

    const payload: CreateOrderInput = {
      full_name: values.fullName,
      phone: values.phone,
      line1: normalizedUseSaved ? (addr?.line1 ?? "") : values.line1,
      line2: normalizedUseSaved ? (addr?.line2 ?? "") : values.line2,
      city: normalizedUseSaved ? (addr?.city ?? "") : values.city,
      region: normalizedUseSaved ? (addr?.region ?? undefined) : undefined,
      shipping_address_id: normalizedUseSaved
        ? values.selectedAddrId
        : undefined,
    };

    const r = await createPendingOrder(payload);

    if (!r.ok) {
      setBannerError(e(r.code));
      if (r.code === "OUT_OF_STOCK" && r.outOfStock?.length)
        setOosItems(r.outOfStock);
      return;
    }

    const redirectUrl = await initBogPayment(r.orderId, locale);
    if (!redirectUrl) {
      setBannerError(e("PAYMENT_INIT_FAILED"));
      return;
    }

    window.location.assign(redirectUrl);
  });

  if (cartIsEmpty) return null;

  const zoneHint =
    shippingZone === "tbilisi"
      ? "თბილისი"
      : shippingZone === "region_city"
        ? "რეგიონი ქალაქი"
        : "რეგიონი სოფელი";

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8"
    >
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        <div className="lg:col-span-7 space-y-12">
          <section
            aria-labelledby="contact-heading"
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <h2
              id="contact-heading"
              className="text-xl font-semibold tracking-tight text-gray-900 mb-6 flex items-center gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                1
              </span>
              {t("contactTitle")}
            </h2>

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <InputField
                id="fullName"
                label={t("fullNameLabel")}
                autoComplete="name"
                error={errors.fullName?.message ?? null}
                {...regFullName}
              />
              <InputField
                id="phone"
                label={t("phoneLabel")}
                inputMode="tel"
                autoComplete="tel"
                error={errors.phone?.message ?? null}
                {...regPhone}
              />
            </div>
          </section>

          <section
            aria-labelledby="shipping-heading"
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2
                id="shipping-heading"
                className="text-xl font-semibold tracking-tight text-gray-900 flex items-center gap-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                  2
                </span>
                {t("shippingTitle")}
              </h2>

              {canUseSaved && (
                <button
                  type="button"
                  onClick={toggleAddressMode}
                  className="group text-sm font-medium text-gray-500 hover:text-black transition-colors flex items-center gap-1"
                >
                  <span>{useSaved ? t("toggleManual") : t("toggleSaved")}</span>
                </button>
              )}
            </div>

            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Shipping zone
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Current: <span className="font-medium">{zoneHint}</span>
                  </p>
                  {shippingUpdating ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Updating shipping…
                    </p>
                  ) : null}
                </div>

                <div className="w-64 max-w-full">
                  <select
                    ref={shippingRef}
                    name={shippingName}
                    value={shippingZone}
                    onChange={async (ev) => {
                      const nextZone = ev.target.value as ShippingZone;
                      setValue("shippingZone", nextZone, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      await applyZone(nextZone);
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                  >
                    <option value="tbilisi">თბილისი</option>
                    <option value="region_city">რეგიონი ქალაქი</option>
                    <option value="region_village">რეგიონი სოფელი</option>
                  </select>
                </div>
              </div>
            </div>

            {useSaved ? (
              <div className="space-y-4">
                {showErr("selectedAddrId") && errors.selectedAddrId?.message ? (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    <AlertCircle size={16} />
                    {errors.selectedAddrId.message}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddrId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={async () => {
                          clearBanner();
                          setValue("selectedAddrId", addr.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });

                          setValue("shippingZone", addr.shipping_zone, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });

                          await applyZone(addr.shipping_zone);
                        }}
                        className={`relative flex flex-col items-start gap-1 rounded-2xl border p-5 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                          isSelected
                            ? "bg-gray-50 border-black shadow-[0_0_0_1px_black] z-10"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex w-full justify-between items-start">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <MapPin
                              size={14}
                              className={
                                isSelected ? "text-black" : "text-gray-400"
                              }
                            />
                            {addr.city}
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isSelected
                                ? "border-black bg-black text-white"
                                : "border-gray-300 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>

                        <p className="mt-1 text-sm text-gray-500 line-clamp-2 pl-6">
                          {addr.line1}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2 animate-in fade-in zoom-in-95 duration-300">
                <div className="sm:col-span-2">
                  <InputField
                    id="line1"
                    label={t("addressLine1Label")}
                    autoComplete="address-line1"
                    {...regLine1}
                    error={
                      showErr("line1") ? (errors.line1?.message ?? null) : null
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <InputField
                    id="line2"
                    label={t("addressLine2Label")}
                    autoComplete="address-line2"
                    {...regLine2}
                  />
                </div>

                <InputField
                  id="city"
                  label={t("cityLabel")}
                  autoComplete="address-level2"
                  {...regCity}
                  error={
                    showErr("city") ? (errors.city?.message ?? null) : null
                  }
                />

                <div className="opacity-60 pointer-events-none select-none">
                  <InputField
                    id="country"
                    label={t("countryLabel")}
                    value={t("countryValue")}
                    disabled
                  />
                </div>
              </div>
            )}
          </section>

          <section
            aria-labelledby="review-heading"
            className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
          >
            <h2
              id="review-heading"
              className="text-xl font-semibold tracking-tight text-gray-900 mb-6 flex items-center gap-2"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                3
              </span>
              {t("reviewTitle")}
            </h2>

            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {cartItems.map((item) => {
                const unit = toNumber(item.price_at_add);
                const qty =
                  typeof item.qty === "number"
                    ? item.qty
                    : (toNumber(item.qty) ?? 0);
                const safeUnit = Number.isFinite(unit) ? unit : 0;
                const safeQty = Number.isFinite(qty) ? qty : 0;
                const lineTotal = safeUnit * safeQty;

                return (
                  <div
                    key={item.id}
                    className="flex gap-6 p-6 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      {hasImg(item.image_url) ? (
                        <Image
                          src={item.image_url}
                          alt={itemTitle(item, locale)}
                          fill
                          sizes="96px"
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-gray-300">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {itemTitle(item, locale)}
                          </h3>
                          {item.variant_code ? (
                            <p className="text-xs text-gray-500 font-medium font-mono">
                              {item.variant_code}
                            </p>
                          ) : null}
                          {item.variant_name ? (
                            <p className="text-xs text-gray-500 font-medium">
                              {t("sizeLabel")} {item.variant_name}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {money(lineTotal, "GEL")}
                        </p>
                      </div>

                      <div className="flex items-center text-xs text-gray-500">
                        <span>
                          {t("qtyLabel")}{" "}
                          <span className="text-gray-900 font-medium">
                            {safeQty}
                          </span>
                        </span>
                        <span className="mx-2 text-gray-300">•</span>
                        <span>{money(unit, "GEL")} / unit</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-16 lg:col-span-5 lg:mt-0">
          <div className="sticky top-10 overflow-hidden rounded-3xl bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] ring-1 ring-gray-900/5">
            <div className="p-8">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-6">
                {t("orderSummaryTitle")}
              </h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">{t("subtotal")}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {money(liveSummary.subtotal, "GEL")}
                  </dd>
                </div>

                {liveSummary.discount_total > 0 ? (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-500">{t("discount")}</dt>
                    <dd className="text-sm font-medium text-emerald-600">
                      -{money(liveSummary.discount_total, "GEL")}
                    </dd>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500 flex items-center gap-2">
                    {t("shipping")}
                    <Truck size={14} className="text-gray-300" />
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {money(liveSummary.shipping_total, "GEL")}
                  </dd>
                </div>

                <div className="my-6 border-t border-gray-100 pt-6 flex items-center justify-between">
                  <dt className="text-base font-bold text-gray-900">
                    {t("total")}
                  </dt>
                  <dd className="text-2xl font-bold tracking-tight text-gray-900">
                    {money(liveSummary.total, "GEL")}
                  </dd>
                </div>
              </dl>

              {bannerError ? (
                <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-red-800">
                        {bannerError}
                      </h3>

                      {oosItems && oosItems.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide opacity-80">
                            {e("OOS_DETAILS_TITLE")}
                          </p>

                          <ul className="space-y-2">
                            {oosItems.map((it) => (
                              <li
                                key={`${it.fina_id}`}
                                className="text-xs text-red-700 bg-white/50 p-2 rounded border border-red-100/50"
                              >
                                <span className="font-semibold block mb-1">
                                  {oosTitleFor(it)}
                                </span>
                                <span>
                                  {eVars("OOS_QTY_LINE", {
                                    requested: it.requested,
                                    available: it.available,
                                  })}
                                </span>
                                <span className="block mt-0.5 opacity-75">
                                  {e(reasonKey(it.reason))}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !isValid || shippingUpdating}
                className="group relative w-full overflow-hidden rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin text-white/50"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      {t("payNow")}
                      <Lock
                        size={14}
                        className="text-white/70 group-hover:text-white transition-colors"
                      />
                    </>
                  )}
                </span>
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Lock size={12} />
                <span>{t("securePayment")}</span>
              </div>
            </div>

            <div className="h-1.5 w-full bg-linear-to-r from-gray-100 via-gray-200 to-gray-100" />
          </div>
        </div>
      </div>
    </form>
  );
}
