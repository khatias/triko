"use server";

import { requireAdmin } from "@/utils/auth/requireAdmin";
import { revalidatePath } from "next/cache";

type ShippingStatus = "" | "confirmed" | "in_transit" | "delivered";

export async function updateShippingStatusAction(input: {
  locale: string;
  orderId: string;
  shipping_status: ShippingStatus;
}) {
  const { locale, orderId, shipping_status } = input;

  const { supabase } = await requireAdmin(locale);

  const patch: { shipping_status: string | null } = {
    shipping_status: shipping_status ? shipping_status : null,
  };

  const { error } = await supabase.from("orders").update(patch).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/admin/orders/${orderId}`);

  return { ok: true as const };
}
