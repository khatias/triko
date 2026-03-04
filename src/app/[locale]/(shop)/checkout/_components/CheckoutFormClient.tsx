"use client";

import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Check,
  ShoppingBag,
  MapPin,
  AlertCircle,
  Truck,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";

import AddAddressCard from "@/components/address/AddAddressCard";
import { addAddressAction } from "@/app/actions/addAddressAction";
import { InputField } from "@/components/form/Field";
import {
  createPendingOrder,
  type CreateOrderInput,
  type OutOfStockItem,
} from "../actions/createPendingOrder";
import {
  setShippingZoneAction,
  type ShippingZone,
} from "../actions/setShippingZone";
import {
  makeGeorgiaPhoneSchema,
} from "@/lib/validation/profile";
import { hasImg, toNumber } from "@/utils/type-guards";
import { formatPrice } from "@/lib/helpers";
import { nameSchema } from "@/lib/validation/profile";
export type AddressRow = {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  shipping_zone: ShippingZone;
  is_default_shipping?: boolean;
};

export type CartItemRow = {
  id: string;

  bundle_key: string | null;
  parent_code: string | null;

  product_name: string | null;
  title_ka?: string | null;
  title_en?: string | null;

  price_at_add: number;
  qty: number;

  image_url?: string | null;
  variant_code?: string | null;
  variant_name?: string | null;
};

export type CheckoutLine =
  | { kind: "single"; key: string; item: CartItemRow }
  | { kind: "bundle"; key: string; items: CartItemRow[] };

export type ProfileInfo = {
  full_name?: string | null;
  phone?: string | null;
};

export type SummaryInfo = {
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;
};

type Props = {
  locale: string;
  savedAddresses: AddressRow[];
  cartLines: CheckoutLine[];
  profileInfo: ProfileInfo;
  summary: SummaryInfo;
  initialZone: ShippingZone;
  initialSelectedAddrId: string;
};

async function initBogPayment(
  orderId: string,
  locale: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/bog/create-order-for-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, locale }),
    });
    const json = await res.json();
    return json?.redirectUrl || null;
  } catch {
    return null;
  }
}

function makeCheckoutSchema(tErr: (k: string) => string) {
  return z.object({
    fullName: nameSchema(tErr),
    phone: makeGeorgiaPhoneSchema({
      t: tErr,
      output: "e164",
      allowLandline: false,
    }),
    selectedAddrId: z.string().min(1, tErr("addressSelectionRequired")),
  });
}

type CheckoutValues = z.infer<ReturnType<typeof makeCheckoutSchema>>;

function pickTitle(it: CartItemRow, locale: "en" | "ka"): string {
  const ka = (it.title_ka ?? "").trim();
  const en = (it.title_en ?? "").trim();
  const name = (it.product_name ?? "").trim();
  if (locale === "ka") return ka || en || name || "Product";
  return en || ka || name || "Product";
}

function bundleHeader(items: CartItemRow[], locale: "en" | "ka") {
  const head = items[0] ?? null;
  const title = head
    ? pickTitle(head, locale)
    : locale === "ka"
      ? "სეტი"
      : "Set";
  const image_url =
    head && hasImg(head.image_url) ? (head.image_url ?? null) : null;
  const qty = head?.qty ?? 1;

  // unit total = sum(unit prices of each bundle component
  const unitSum = items.reduce((acc, x) => acc + toNumber(x.price_at_add), 0);
  const lineTotal = unitSum * qty;

  return { title, image_url, qty, lineTotal };
}

export default function CheckoutFormClient({
  locale,
  savedAddresses,
  cartLines,
  profileInfo,
  summary,
  initialZone,
  initialSelectedAddrId,
}: Props) {
  const router = useRouter();
  const t = useTranslations("Checkout");
  const eIntl = useTranslations("Errors");
  const e = useCallback((k: string) => eIntl(k as never), [eIntl]);

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [oosItems, setOosItems] = useState<OutOfStockItem[] | null>(null);
  const [liveSummary, setLiveSummary] = useState<SummaryInfo>(summary);
  const [shippingUpdating, setShippingUpdating] = useState(false);

  const cartIsEmpty = cartLines.length === 0;

  const schema = useMemo(() => makeCheckoutSchema(e), [e]);

  const safeInitialSelectedAddrId = useMemo(() => {
    if (!savedAddresses.length) return "";

    const ids = new Set(savedAddresses.map((a) => a.id));
    if (initialSelectedAddrId && ids.has(initialSelectedAddrId))
      return initialSelectedAddrId;

    const def = savedAddresses.find((a) => a.is_default_shipping)?.id;
    return def ?? savedAddresses[0].id;
  }, [initialSelectedAddrId, savedAddresses]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: profileInfo.full_name ?? "",
      phone: profileInfo.phone ?? "",
      selectedAddrId: safeInitialSelectedAddrId,
    },
  });

  const selectedAddrId = watch("selectedAddrId");

  const selectedAddr = useMemo(() => {
    if (!selectedAddrId) return null;
    return savedAddresses.find((a) => a.id === selectedAddrId) ?? null;
  }, [savedAddresses, selectedAddrId]);

  useEffect(() => {
    if (!savedAddresses.length) return;

    const exists =
      selectedAddrId && savedAddresses.some((a) => a.id === selectedAddrId);
    if (!exists) {
      setValue("selectedAddrId", safeInitialSelectedAddrId, {
        shouldValidate: true,
      });
    }
  }, [savedAddresses, selectedAddrId, safeInitialSelectedAddrId, setValue]);

  const didInit = useRef(false);

  const updateShipping = useCallback(
    async (zone: ShippingZone, addrId: string) => {
      if (shippingUpdating) return;

      setShippingUpdating(true);
      setBannerError(null);

      const res = await setShippingZoneAction(locale, zone, addrId);

      setShippingUpdating(false);

      if (res.ok) {
        setLiveSummary(res.summary);
        router.refresh();
      } else {
        setBannerError("Failed to calculate shipping price");
      }
    },
    [locale, router, shippingUpdating],
  );

  useEffect(() => {
    if (didInit.current) return;
    if (!selectedAddr) return;

    didInit.current = true;

    const shippingMissing = Number(liveSummary.shipping_total ?? 0) <= 0;

    const needsSync =
      shippingMissing ||
      selectedAddr.shipping_zone !== initialZone ||
      !initialSelectedAddrId;

    if (needsSync) {
      updateShipping(selectedAddr.shipping_zone, selectedAddr.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddr]);

  const handleSelectAddress = useCallback(
    async (addr: AddressRow) => {
      if (shippingUpdating) return;

      setValue("selectedAddrId", addr.id, { shouldValidate: true });
      setBannerError(null);

      await updateShipping(addr.shipping_zone, addr.id);
    },
    [setValue, updateShipping, shippingUpdating],
  );

  const onSubmit = async (values: CheckoutValues) => {
    setBannerError(null);
    setOosItems(null);

    const addr = savedAddresses.find((a) => a.id === values.selectedAddrId);
    if (!addr) {
      setBannerError(e("addressSelectionRequired"));
      return;
    }

    const payload: CreateOrderInput = {
      full_name: values.fullName,
      phone: values.phone,
      shipping_address_id: values.selectedAddrId,
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      region: addr.region || undefined,
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
  };

  if (cartIsEmpty) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 xl:gap-x-16">
        {/* LEFT */}
        <div className="lg:col-span-7 space-y-12">
          {/* 1. Contact */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                1
              </span>
              {t("contactTitle")}
            </h2>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <InputField
                id="fullName"
                label={t("fullNameLabel")}
                error={errors.fullName?.message ?? null}
                {...register("fullName")}
              />
              <InputField
                id="phone"
                label={t("phoneLabel")}
                inputMode="tel"
                error={errors.phone?.message ?? null}
                {...register("phone")}
              />
            </div>
          </section>

          {/* 2. Shipping */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                2
              </span>
              {t("shippingTitle")}
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddrId === addr.id;

                const title =
                  addr.shipping_zone === "region_village"
                    ? `${addr.region ?? ""}${addr.region ? ", " : ""}${addr.city}`
                    : addr.city;

                const zoneLabel =
                  addr.shipping_zone === "tbilisi"
                    ? "Tbilisi"
                    : addr.shipping_zone === "region_city"
                      ? "City"
                      : "Village";

                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr)}
                    disabled={shippingUpdating}
                    className={clsx(
                      "relative flex flex-col items-start gap-1 rounded-2xl border p-5 text-left outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
                      isSelected
                        ? "z-10 border-black bg-slate-50 shadow-sm ring-1 ring-black"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
                    )}
                  >
                    <div className="mb-1 flex w-full items-start justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <MapPin
                          size={16}
                          className={
                            isSelected ? "text-black" : "text-gray-400"
                          }
                        />
                        {title}
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <p className="mb-2 line-clamp-2 pl-6 text-sm text-gray-600">
                      {addr.line1}
                    </p>

                    <span className="ml-6 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {zoneLabel}
                    </span>
                  </button>
                );
              })}

              <div className="flex min-h-35 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-orange-300 hover:bg-slate-50">
                <AddAddressCard action={addAddressAction} />
              </div>
            </div>

            {errors.selectedAddrId && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} />
                {errors.selectedAddrId.message}
              </div>
            )}
          </section>

          {/* 3. Review */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold tracking-tight text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                3
              </span>
              {t("reviewTitle")}
            </h2>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {cartLines.map((line) => {
                if (line.kind === "single") {
                  const item = line.item;
                  const title = pickTitle(item, locale as "en" | "ka");
                  return (
                    <div
                      key={line.key}
                      className="flex gap-4 p-4 sm:p-6 hover:bg-gray-50/50"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                        {hasImg(item.image_url) ? (
                          <Image
                            src={item.image_url as string}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ShoppingBag className="m-auto mt-6 text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="line-clamp-2 text-sm font-semibold">
                              {title}
                            </div>

                            <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                              x{item.qty}
                            </div>

                            {item.variant_code ? (
                              <div className="mt-2 font-mono text-[10px] text-gray-400">
                                {item.variant_code}
                              </div>
                            ) : null}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {formatPrice(
                                toNumber(item.price_at_add) * item.qty,
                                "GEL",
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // bundle
                const meta = bundleHeader(line.items, locale as "en" | "ka");

                return (
                  <div
                    key={line.key}
                    className="flex gap-4 p-4 sm:p-6 hover:bg-gray-50/50"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      {meta.image_url ? (
                        <Image
                          src={meta.image_url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag className="m-auto mt-6 text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold">
                            {meta.title}
                          </div>
                          <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                            {locale === "ka" ? "სეტი" : "Set"} · x{meta.qty}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {formatPrice(meta.lineTotal, "GEL")}
                          </div>
                        </div>
                      </div>

                      {/* optional: show parts */}
                      <div className="mt-3 space-y-1">
                        {line.items.map((it) => (
                          <div
                            key={it.id}
                            className="text-xs text-gray-500 flex items-center justify-between gap-3"
                          >
                            {it.variant_code ? (
                              <span className="shrink-0 font-mono text-[10px] text-gray-400">
                                {it.variant_code}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {oosItems?.length ? (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                Some items are out of stock.
              </div>
            ) : null}
          </section>
        </div>

        {/* RIGHT */}
        <div className="mt-16 lg:col-span-5 lg:mt-0">
          <div className="sticky top-10 overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-900/5">
            <div className="p-8">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-gray-900">
                {t("orderSummaryTitle")}
              </h2>

              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">{t("subtotal")}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatPrice(liveSummary.subtotal, "GEL")}
                  </dd>
                </div>

                {liveSummary.discount_total > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <dt className="text-sm">{t("discount")}</dt>
                    <dd className="text-sm font-medium">
                      -{formatPrice(liveSummary.discount_total, "GEL")}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-gray-500">
                    {t("shipping")}{" "}
                    <Truck size={14} className="text-gray-300" />
                  </dt>
                  <dd
                    className={clsx(
                      "text-sm font-medium text-gray-900",
                      shippingUpdating && "opacity-50",
                    )}
                  >
                    {shippingUpdating
                      ? "..."
                      : formatPrice(liveSummary.shipping_total, "GEL")}
                  </dd>
                </div>

                <div className="my-6 flex items-center justify-between border-t border-gray-100 pt-6">
                  <dt className="text-base font-bold text-gray-900">
                    {t("total")}
                  </dt>
                  <dd
                    className={clsx(
                      "text-2xl font-bold text-gray-900",
                      shippingUpdating && "opacity-50",
                    )}
                  >
                    {shippingUpdating
                      ? "..."
                      : formatPrice(liveSummary.total, "GEL")}
                  </dd>
                </div>
              </dl>

              {bannerError && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                  <AlertCircle className="h-5 w-5 shrink-0" /> {bannerError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !isValid || shippingUpdating}
                className="group relative w-full overflow-hidden rounded-xl bg-black px-4 py-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    t("processing")
                  ) : (
                    <>
                      {t("payNow")}
                      <Lock
                        size={14}
                        className="text-white/70 group-hover:text-white"
                      />
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
