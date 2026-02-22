"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Truck } from "lucide-react";
import { updateShippingStatusAction } from "../actions/adminOrderActions";
import { type ShippingStatus } from "@/components/UI/ShippingStatus";
import { useTranslations } from "next-intl";
type Props = {
  currentValue: string;
  orderId: string;
  locale: string;
};

export default function ShippingStatusSelect({
  currentValue,
  orderId,
  locale,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useTranslations("Admin.Orders");
  const a = useTranslations("Admin.actions");
  const OPTIONS: Array<{ value: ShippingStatus | null; label: string }> = [
    { value: "not_started", label: t("notStarted") },
    { value: "confirmed", label: t("confirmed") },
    { value: "in_transit", label: t("inTransit") },
    { value: "delivered", label: t("delivered") },
  ];

  const serverValue =
    currentValue === null ? null : (currentValue as ShippingStatus | null);
  const [value, setValue] = useState<ShippingStatus | null>(serverValue);

  useEffect(() => {
    setValue(serverValue);
  }, [serverValue]);

  const dirty = useMemo(() => value !== serverValue, [value, serverValue]);

  function onChange(next: ShippingStatus | null) {
    setValue(next);

    startTransition(async () => {
      if (next !== null) {
        await updateShippingStatusAction({
          locale,
          orderId,
          shipping_status: next,
        });

        router.refresh();
      }
    });
  }

  return (
    <div className="w-full">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <Truck className="h-4 w-4" />
        </div>

        <select
          value={value ?? ""}
          onChange={(e) => {
            const val =
              e.target.value === "" ? null : (e.target.value as ShippingStatus);
            onChange(val);
          }}
          disabled={pending}
          className="h-10 w-full appearance-none rounded-xl border border-zinc-200 bg-white pl-10 pr-9 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-300 focus:border-black focus:outline-none focus:ring-4 focus:ring-black/10 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-white dark:focus:ring-white/10"
        >
          {OPTIONS.map((o) => (
            <option key={o.value ?? ""} value={o.value ?? ""}>
              {o.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
        <span>{pending ? a("saving") : a("autoSave")}</span>
        {dirty && !pending ? <span>Updating…</span> : null}
      </div>
    </div>
  );
}
