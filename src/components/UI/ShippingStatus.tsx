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

export type ShippingStatus =
  | "not_started"
  | "confirmed"
  | "in_transit"
  | "delivered"
  | null;

export function StatusBadge({
  order,
  status,
}: {
  order: OrderType;
  status: ShippingStatus | null;
}) {
  const t = useTranslations("Profile.orders");

  // 1) Shipping status takes priority when present
  if (status) {
    let colorClass = "bg-blue-50 text-blue-700 border-blue-100";
    let Icon = Box;
    let labelKey:
      | "notStartedLabel"
      | "confirmedLabel"
      | "inTransitLabel"
      | "deliveredLabel" = "confirmedLabel";

    if (status === "not_started") {
      colorClass = "bg-gray-50 text-gray-700 border-gray-100";
      Icon = Box;
      labelKey = "notStartedLabel";
    } else if (status === "confirmed") {
      colorClass = "bg-blue-50 text-blue-700 border-blue-100";
      Icon = Box;
      labelKey = "confirmedLabel";
    } else if (status === "in_transit") {
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
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${colorClass}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{t(labelKey)}</span>
      </div>
    );
  }

  // 2) If no shipping_status yet, show payment-related states
  if (isFailedStatus(order.status)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-rose-700">
        <XCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">{t("paymentFailedLabel")}</span>
      </div>
    );
  }

  if (isPendingStatus(order.status)) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-amber-700">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold">
          {t("awaitingPaymentLabel")}
        </span>
      </div>
    );
  }

  // 3) Fallback
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-gray-700">
      <Box className="h-3.5 w-3.5" />
      <span className="text-xs font-semibold">{t("notStartedLabel")}</span>
    </div>
  );
}
