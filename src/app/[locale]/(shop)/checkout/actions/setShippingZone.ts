// src/app/[locale]/(shop)/checkout/actions/setShippingZone.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ShippingZone = "tbilisi" | "region_city" | "region_village";

const RpcRowSchema = z.object({
  cart_id: z.string().uuid(),
  shipping_zone: z.string(),
  shipping_address_id: z.string().uuid().nullable(),
  subtotal: z.coerce.number(),
  discount_total: z.coerce.number(),
  shipping_total: z.coerce.number(),
  total: z.coerce.number(),
});

type RpcRow = z.infer<typeof RpcRowSchema>;

export type SetShippingZoneResult =
  | {
      ok: true;
      summary: {
        subtotal: number;
        discount_total: number;
        shipping_total: number;
        total: number;
      };
      cart: {
        cart_id: string;
        shipping_zone: ShippingZone;
        shipping_address_id: string | null;
      };
    }
  | {
      ok: false;
      code: "SHIPPING_UPDATE_FAILED";
      debug: {
        message: string;
        details: string | null;
        hint: string | null;
        returned: unknown;
      };
    };

export async function setShippingZoneAction(
  locale: string,
  zone: ShippingZone,
  shippingAddressId?: string | null,
): Promise<SetShippingZoneResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "cart_set_shipping_zone_and_recalc",
    {
      p_shipping_zone: zone,
      p_shipping_address_id: shippingAddressId ?? null,
    },
  );

  if (error) {
    return {
      ok: false,
      code: "SHIPPING_UPDATE_FAILED",
      debug: {
        message: error.message,
        details: error.details ?? null,
        hint: error.hint ?? null,
        returned: data,
      },
    };
  }

  const maybeRow: unknown = Array.isArray(data)
    ? data.length > 0
      ? data[0]
      : null
    : data;

  const parsed = RpcRowSchema.safeParse(maybeRow);
  if (!parsed.success) {
    return {
      ok: false,
      code: "SHIPPING_UPDATE_FAILED",
      debug: {
        message: "RPC_RETURN_SHAPE_MISMATCH",
        details: parsed.error.message,
        hint: null,
        returned: maybeRow,
      },
    };
  }

  const row: RpcRow = parsed.data;

  revalidatePath(`/${locale}/checkout`);
  revalidatePath(`/${locale}/cart`);

  return {
    ok: true,
    summary: {
      subtotal: row.subtotal,
      discount_total: row.discount_total,
      shipping_total: row.shipping_total,
      total: row.total,
    },
    cart: {
      cart_id: row.cart_id,
      shipping_zone: zone,
      shipping_address_id: row.shipping_address_id,
    },
  };
}
