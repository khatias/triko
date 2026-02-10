import { Box, Clock, MapPin, Truck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { isFailedStatus, isPendingStatus } from "@/utils/type-guards";
export type OrderType = {
  id: string;
  status: string;
  shipping_status: ShippingStatus | null;
  items_count: number;
  subtotal: number;
  discount_total: number;
  total: number;
  created_at: string;
  currency?: string | null;
};
export type ShippingStatus = "confirmed" | "in_transit" | "delivered" | null;

export function StatusBadge({
  order,
  status,
}: {
  order: OrderType;
  status: ShippingStatus | null;
}) {
  const t = useTranslations("Profile.orders");

  if (status) {
    let colorClass = "bg-blue-50 text-blue-700 border-blue-100";
    let Icon = Box;
    let labelKey = "confirmedLabel";

    if (status === "in_transit") {
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
      Icon = Truck;
      labelKey = "inTransitLabel";
    } else if (status === "delivered") {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
      Icon = MapPin;
      labelKey = "deliveredLabel";
    }

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${colorClass}`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{t(labelKey)}</span>
      </div>
    );
  }

  if (isFailedStatus(order.status)) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-100">
        <XCircle className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{t("paymentFailedLabel")}</span>
      </div>
    );
  }

  if (isPendingStatus(order.status)) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-100">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">
          {t("awaitingPaymentLabel")}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-100">
      <div className="w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-xs font-semibold">{t("notStartedLabel")}</span>
    </div>
  );
}
