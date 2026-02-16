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
  fullNameSchema,
  makeGeorgiaPhoneSchema,
} from "@/lib/validation/profile";
import { hasImg, toNumber } from "@/utils/type-guards";
import { displayTitle, formatPrice } from "@/lib/helpers";

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
  product_name: string;
  title_ka?: string | null;
  title_en?: string | null;
  price_at_add: number;
  qty: number;
  image_url?: string | null;
  variant_code?: string | null;
  variant_name?: string | null;
};

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
  cartItems: CartItemRow[];
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
    fullName: fullNameSchema(tErr),
    phone: makeGeorgiaPhoneSchema({
      t: tErr,
      output: "e164",
      allowLandline: false,
    }),
    selectedAddrId: z.string().min(1, tErr("addressSelectionRequired")),
  });
}

type CheckoutValues = z.infer<ReturnType<typeof makeCheckoutSchema>>;

export default function CheckoutFormClient({
  locale,
  savedAddresses,
  cartItems,
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

  const cartIsEmpty = cartItems.length === 0;

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

  // If address list changes (e.g. user added a new address) and selected is missing, fallback safely.
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

  // Prevent duplicate shipping RPC calls on mount + React strict mode dev double-invoke
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
        // If you want debug, change this line to include res.debug.message
        setBannerError("Failed to calculate shipping price");
      }
    },
    [locale, router, shippingUpdating],
  );

  // On first render, if we have a selected address and cart zone differs, sync it.
  useEffect(() => {
    if (didInit.current) return;
    if (!selectedAddr) return;

    didInit.current = true;

    // Only call if needed:
    // - zone differs from cart initial zone OR
    // - cart didn't have selected address persisted (initialSelectedAddrId empty)
    const needsSync =
      selectedAddr.shipping_zone !== initialZone || !initialSelectedAddrId;

    if (needsSync) {
      updateShipping(selectedAddr.shipping_zone, selectedAddr.id);
    }
  }, [selectedAddr, initialZone, initialSelectedAddrId, updateShipping]);

  const handleSelectAddress = useCallback(
    async (addr: AddressRow) => {
      if (shippingUpdating) return;

      setValue("selectedAddrId", addr.id, { shouldValidate: true });
      setBannerError(null);

      // Always call because RPC also persists shipping_address_id
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
        <div className="lg:col-span-7 space-y-12">
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-6 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                1
              </span>
              {t("contactTitle")}
            </h2>

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
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

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-6 flex items-center gap-2">
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
                      "relative flex flex-col items-start gap-1 rounded-2xl border p-5 text-left transition-all duration-200 outline-none disabled:opacity-60 disabled:cursor-not-allowed",
                      isSelected
                        ? "bg-slate-50 border-black ring-1 ring-black shadow-sm z-10"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                    )}
                  >
                    <div className="flex w-full justify-between items-start mb-1">
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

                    <p className="text-sm text-gray-600 line-clamp-2 pl-6 mb-2">
                      {addr.line1}
                    </p>

                    <span className="ml-6 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                      {zoneLabel}
                    </span>
                  </button>
                );
              })}

              <div className="min-h-35 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-orange-300 transition-all">
                <AddAddressCard action={addAddressAction} />
              </div>
            </div>

            {errors.selectedAddrId && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                <AlertCircle size={16} />
                {errors.selectedAddrId.message}
              </div>
            )}
          </section>

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 mb-6 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                3
              </span>
              {t("reviewTitle")}
            </h2>

            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 sm:p-6 hover:bg-gray-50/50"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                    {hasImg(item.image_url) ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="m-auto mt-6 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm line-clamp-2">
                      {displayTitle(item, locale as "en" | "ka")}
                    </div>
                    <div className="text-sm font-bold mt-1 text-gray-900">
                      {formatPrice(
                        toNumber(item.price_at_add) * item.qty,
                        "GEL",
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {oosItems?.length ? (
              <div className="mt-4 rounded-xl bg-amber-50 p-4 border border-amber-100 text-sm text-amber-900">
                Some items are out of stock.
              </div>
            ) : null}
          </section>
        </div>

        <div className="mt-16 lg:col-span-5 lg:mt-0">
          <div className="sticky top-10 overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-gray-900/5">
            <div className="p-8">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-6">
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
                  <dt className="text-sm text-gray-500 flex items-center gap-2">
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

                <div className="my-6 border-t border-gray-100 pt-6 flex items-center justify-between">
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
                <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-100 text-sm text-red-800 flex items-center gap-2">
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
