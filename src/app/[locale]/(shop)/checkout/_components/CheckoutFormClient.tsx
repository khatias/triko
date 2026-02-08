"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Lock, Check, ShoppingBag } from "lucide-react";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createPendingOrder,
  type CreateOrderInput,
} from "../actions/createPendingOrder";
import type {
  AddressRow,
  CartItemRow,
  ProfileInfo,
  SummaryInfo,
} from "../page";
import { hasImg, toNumber } from "@/utils/type-guards";
import { formatPrice } from "@/lib/helpers";

import { addressSchema, fullNameSchema } from "@/lib/validation/profile";

/* ---------------- helpers ---------------- */

function itemTitle(item: CartItemRow, locale: string) {
  const localized = locale === "ka" ? item.title_ka : item.title_en;
  return (localized?.trim() || item.product_name || "Product").trim();
}

function money(v: number | null, currency: string | null): string | null {
  if (v == null) return null;
  return formatPrice(v, currency);
}

function normalizeGePhoneToNational9(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("995") && digits.length === 12) return digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
  if (digits.length === 9) return digits;
  return null;
}

function makeGeorgiaPhoneSchema(params: {
  t: (k: string) => string;
  output?: "national" | "e164";
  allowLandline?: boolean;
}) {
  const { t, output = "e164", allowLandline = false } = params;

  return z
    .string()
    .trim()
    .min(1, { message: t("phoneRequired") })
    .transform((raw, ctx) => {
      const s = raw.trim();

      // ✅ reject letters and random chars
      if (!/^[0-9+\s()-]*$/.test(s)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneInvalidCharacters"),
        });
        return z.NEVER;
      }

      const national9 = normalizeGePhoneToNational9(s);
      if (!national9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneMustHave9Digits"),
        });
        return z.NEVER;
      }

      if (/^(\d)\1{8}$/.test(national9)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneLooksInvalid"),
        });
        return z.NEVER;
      }

      if (!allowLandline && !national9.startsWith("5")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneMustBeMobile"),
        });
        return z.NEVER;
      }

      return output === "e164" ? `+995${national9}` : national9;
    });
}

/* ---------------- schema ---------------- */

function makeCheckoutSchema(t: (k: string) => string) {
  const phone = makeGeorgiaPhoneSchema({
    t,
    output: "e164",
    allowLandline: false,
  });

  const fullName = fullNameSchema(t);
  const addr = addressSchema(t);

  return z
    .object({
      fullName,
      phone,
      useSaved: z.boolean(),

      selectedAddrId: z.string(),
      line1: z.string(),
      line2: z.string(),
      city: z.string(),
    })
    .superRefine((val, ctx) => {
      if (val.useSaved) {
        if (!val.selectedAddrId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["selectedAddrId"],
            message: t("addressSelectionRequired"),
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
            code: z.ZodIssueCode.custom,
            path: ["line1"],
            message: flat.line1[0],
          });
        }
        if (flat.city?.[0]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["city"],
            message: flat.city[0],
          });
        }
      }
    });
}

type CheckoutValues = z.infer<ReturnType<typeof makeCheckoutSchema>>;

/* ---------------- component ---------------- */

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
  const tErrorsIntl = useTranslations("Errors");
  const tErrors = useMemo(
    () => (k: string) => tErrorsIntl(k as never),
    [tErrorsIntl],
  );

  const schema = useMemo(() => makeCheckoutSchema(tErrors), [tErrors]);

  const [bannerError, setBannerError] = useState<string | null>(null);

  const defaultUseSaved = savedAddresses.length > 0;
  const defaultAddrId = savedAddresses[0]?.id ?? "";

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
    reValidateMode: "onChange",
    defaultValues: {
      fullName: profileInfo.full_name ?? "",
      phone: profileInfo.phone ?? "",
      useSaved: defaultUseSaved,
      selectedAddrId: defaultAddrId,
      line1: "",
      line2: "",
      city: "",
    },
  });

  const useSaved = watch("useSaved");
  const selectedAddrId = watch("selectedAddrId");

  const selectedAddress = useMemo(() => {
    if (!useSaved) return null;
    return savedAddresses.find((a) => a.id === selectedAddrId) ?? null;
  }, [useSaved, savedAddresses, selectedAddrId]);

  // keep selection valid if list changes
  useEffect(() => {
    if (!savedAddresses.length) {
      setValue("useSaved", false, { shouldValidate: true });
      setValue("selectedAddrId", "", { shouldValidate: true });
      return;
    }

    if (useSaved) {
      const stillExists = savedAddresses.some((a) => a.id === selectedAddrId);
      if (!stillExists) {
        setValue("selectedAddrId", savedAddresses[0]?.id ?? "", {
          shouldValidate: true,
        });
      }
    }
  }, [savedAddresses, useSaved, selectedAddrId, setValue]);

  // hydrate visible fields when saved selected (optional)
  useEffect(() => {
    if (!useSaved) return;
    if (!selectedAddress) return;

    setValue("line1", selectedAddress.line1 ?? "", { shouldValidate: false });
    setValue("line2", selectedAddress.line2 ?? "", { shouldValidate: false });
    setValue("city", selectedAddress.city ?? "", { shouldValidate: false });
  }, [useSaved, selectedAddress, setValue]);

  // show errors as soon as user changed a field OR after submit
  const showErr = (name: keyof CheckoutValues) =>
    Boolean(errors[name]?.message) &&
    (Boolean(dirtyFields[name]) || isSubmitted);

  const onSubmit = handleSubmit(async (values) => {
    setBannerError(null);

    // extra guard: ensure saved address id still exists
    if (values.useSaved) {
      const exists = savedAddresses.some((a) => a.id === values.selectedAddrId);
      if (!exists) {
        setError("selectedAddrId", {
          type: "validate",
          message: tErrors("addressSelectionRequired"),
        });
        return;
      }
    }

    const addr = values.useSaved
      ? (savedAddresses.find((a) => a.id === values.selectedAddrId) ?? null)
      : null;

    const payload: CreateOrderInput = {
      full_name: values.fullName,
      phone: values.phone, // ✅ e164 +995...
      line1: values.useSaved ? (addr?.line1 ?? "") : values.line1,
      line2: values.useSaved ? (addr?.line2 ?? "") : values.line2,
      city: values.useSaved ? (addr?.city ?? "") : values.city,
      shipping_address_id: values.useSaved ? values.selectedAddrId : undefined,
    };

    try {
      const { orderId } = await createPendingOrder(payload);

      const res = await fetch("/api/bog/create-order-for-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, locale }),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "message" in data &&
          typeof (data as { message: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Payment initiation failed.";
        throw new Error(msg);
      }

      const redirectUrl =
        typeof data === "object" &&
        data !== null &&
        "redirectUrl" in data &&
        typeof (data as { redirectUrl: unknown }).redirectUrl === "string"
          ? (data as { redirectUrl: string }).redirectUrl
          : null;

      if (!redirectUrl) throw new Error("Payment initiation failed.");

      window.location.assign(redirectUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setBannerError(msg);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-12 lg:grid-cols-12"
    >
      {/* LEFT */}
      <div className="lg:col-span-7 space-y-10">
        {/* Products */}
        <section>
          <h2 className="text-lg font-semibold text-black mb-4">
            Review Your Products
          </h2>

          <div className="space-y-4">
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
                  className="group flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100 shadow-sm">
                    {hasImg(item.image_url) ? (
                      <Image
                        src={item.image_url}
                        alt={itemTitle(item, locale)}
                        fill
                        sizes="80px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-gray-300">
                        <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-2">
                        {itemTitle(item, locale)}
                      </h4>
                      <p className="text-sm font-bold text-red-600 whitespace-nowrap">
                        {money(lineTotal, "GEL")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600">
                        Qty: {safeQty}
                      </span>
                      {item.variant_code ? (
                        <span className="text-xs text-gray-400 truncate">
                          {item.variant_code}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-black mb-6">
            Contact Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MinimalInput
              label="Full Name"
              placeholder="Name Surname"
              autoComplete="name"
              registration={register("fullName")}
              error={
                showErr("fullName") ? (errors.fullName?.message ?? null) : null
              }
            />

            <MinimalInput
              label="Phone Number"
              placeholder="+995 5XX XX XX XX"
              inputMode="tel"
              autoComplete="tel"
              registration={register("phone")}
              error={showErr("phone") ? (errors.phone?.message ?? null) : null}
            />
          </div>
        </section>

        {/* Shipping */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black">
              Shipping Address
            </h2>

            {savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setValue("useSaved", !useSaved, { shouldValidate: true });
                  setBannerError(null);
                }}
                className="text-sm font-medium text-gray-500 hover:text-black underline decoration-gray-300 underline-offset-4"
              >
                {useSaved ? "Enter manually" : "Select saved address"}
              </button>
            )}
          </div>

          {useSaved ? (
            <div className="space-y-3">
              {showErr("selectedAddrId") && errors.selectedAddrId?.message ? (
                <div className="mb-2 text-sm text-red-600">
                  {errors.selectedAddrId.message}
                </div>
              ) : null}

              {savedAddresses.map((addr) => {
                const isSelected = selectedAddrId === addr.id;

                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() =>
                      setValue("selectedAddrId", addr.id, {
                        shouldValidate: true,
                      })
                    }
                    className={`w-full text-left relative rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-black bg-white shadow-sm"
                        : "border-gray-200 bg-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-black truncate">
                          {addr.city}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {addr.line1}
                        </p>
                      </div>

                      {isSelected ? (
                        <div className="h-5 w-5 bg-black rounded-full flex items-center justify-center text-white shrink-0">
                          <Check size={12} />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-gray-300 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              <MinimalInput
                label="Address Line"
                placeholder="Street, Building, Apt"
                autoComplete="address-line1"
                registration={register("line1")}
                error={
                  showErr("line1") ? (errors.line1?.message ?? null) : null
                }
              />

              <MinimalInput
                label="Address Line 2"
                placeholder="Apartment, floor, etc."
                autoComplete="address-line2"
                registration={register("line2")}
              />

              <div className="grid grid-cols-2 gap-5">
                <MinimalInput
                  label="City"
                  placeholder="City"
                  autoComplete="address-level2"
                  registration={register("city")}
                  error={
                    showErr("city") ? (errors.city?.message ?? null) : null
                  }
                />

                <div className="opacity-50 pointer-events-none">
                  <MinimalInput label="Country" value="Georgia" disabled />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-5">
        <div className="sticky top-10 rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-lg font-semibold mb-6">Order Summary</h2>

          <div className="space-y-4 border-b border-gray-100 pb-6 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">
                {money(summary.subtotal, "GEL")}
              </span>
            </div>

            {summary.discount_total > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-red-600">
                  -{money(summary.discount_total, "GEL")}
                </span>
              </div>
            ) : null}

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="font-medium">
                {money(summary.shipping_total, "GEL")}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mb-8">
            <span className="text-base font-semibold">Total</span>
            <span className="text-3xl font-bold tracking-tight">
              {money(summary.total, "GEL")}
            </span>
          </div>

          {bannerError ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {bannerError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full h-14 bg-black text-white rounded-xl font-medium text-base transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Processing..." : "Pay Now"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock size={12} />
            <span>Secure payment via Bank of Georgia</span>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ---------------- MinimalInput ---------------- */

type MinimalInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "onChange" | "onBlur" | "ref"
> & {
  label: string;
  error?: string | null;
  registration?: UseFormRegisterReturn;
};

function MinimalInput({
  label,
  error,
  registration,
  className,
  ...props
}: MinimalInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
        {label}
      </label>

      <input
        {...props}
        {...registration}
        aria-invalid={Boolean(error)}
        className={[
          "w-full h-12 rounded-xl border bg-white px-4 text-sm outline-none transition-all placeholder:text-gray-300 disabled:bg-gray-50",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-gray-200 focus:border-black focus:ring-1 focus:ring-black",
          className ?? "",
        ].join(" ")}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
