"use server";

import { requireAdmin } from "@/utils/auth/requireAdmin";
import { revalidatePath } from "next/cache";

type ShippingStatus =
  | ""
  | "not_started"
  | "confirmed"
  | "in_transit"
  | "delivered";

type UpdatedOrderRow = {
  order_id: string;
  shipping_status: string | null;
};

export async function updateShippingStatusAction(input: {
  locale: string;
  orderId: string;
  shipping_status: ShippingStatus;
}) {
  const { locale, orderId, shipping_status } = input;

  const { supabase } = await requireAdmin(locale);

  const { data, error } = await supabase.rpc(
    "admin_update_order_shipping_status",
    {
      p_order_id: orderId,
      p_shipping_status: shipping_status || null,
    },
  );

  if (error) {
    throw new Error(`SHIPPING_STATUS_UPDATE_FAILED: ${error.message}`);
  }

  const updatedOrder: UpdatedOrderRow | null =
    Array.isArray(data) && data.length > 0
      ? (data[0] as UpdatedOrderRow)
      : null;

  if (!updatedOrder) {
    throw new Error(
      "SHIPPING_STATUS_UPDATE_FAILED: No order row was returned.",
    );
  }

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);

  return {
    ok: true as const,
    shipping_status: updatedOrder.shipping_status,
  };
}