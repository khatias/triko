// src/app/[locale]/(shop)/checkout/actions/createPendingOrder.ts
"use server";

import { createClient } from "@/utils/supabase/server";

export type CreateOrderInput = {
  full_name: string;
  phone: string;

  line1: string;
  line2?: string;
  city: string;
  region?: string;

  shipping_address_id?: string;
};

type RpcArgs = {
  p_full_name: string;
  p_phone: string;
  p_line1: string;
  p_line2: string;
  p_city: string;
  p_region: string;
  p_shipping_address_id: string | null;
  p_reserve_minutes: number;
};

function norm(v: string) {
  return v.trim();
}

function req(v: string, field: string) {
  const s = norm(v);
  if (!s) throw new Error(`MISSING_${field.toUpperCase()}`);
  return s;
}

// optional: map DB exceptions to your app error codes
function normalizeSupabaseErrorMessage(msg: string) {
  const m = msg.toUpperCase();

  if (m.includes("AUTH_REQUIRED")) return "AUTH_REQUIRED";
  if (m.includes("CART_EMPTY")) return "CART_EMPTY";
  if (m.includes("OUT_OF_STOCK")) return "OUT_OF_STOCK";
  if (m.includes("CART_ITEM_INVALID_QTY")) return "CART_ITEM_INVALID_QTY";

  // Fallback
  return "CHECKOUT_FAILED";
}

export async function createPendingOrder(input: CreateOrderInput) {
  const supabase = await createClient();

  // Ensure auth (optional because function also checks auth.uid())
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("AUTH_REQUIRED");

  const args: RpcArgs = {
    p_full_name: req(input.full_name, "full_name"),
    p_phone: req(input.phone, "phone"),

    p_line1: req(input.line1, "line1"),
    p_line2: norm(input.line2 ?? ""),
    p_city: req(input.city, "city"),
    p_region: norm(input.region ?? ""),

    p_shipping_address_id: input.shipping_address_id ?? null,

    // 15 minutes is a good default; you can tweak later
    p_reserve_minutes: 15,
  };

  const { data, error } = await supabase.rpc(
    "create_pending_order_from_cart",
    args,
  );

  if (error) {
    // DB will throw exceptions like 'OUT_OF_STOCK', etc.
    throw new Error(normalizeSupabaseErrorMessage(error.message));
  }

  // rpc returns uuid as string
  const orderId = data as string;
  if (!orderId) throw new Error("CHECKOUT_FAILED");

  return { orderId };
}
