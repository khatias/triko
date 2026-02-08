// src/app/[locale]/(shop)/checkout/actions/createPendingOrder.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

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

export type OutOfStockReason =
  | "reserved_temporarily"
  | "no_stock"
  | "insufficient";

export type OutOfStockItem = {
  fina_id: number;
  code: string | null;
  product_name: string | null;
  title_ka: string | null;
  title_en: string | null;
  requested: number;
  available: number;
  rest: number;
  reserved: number;
  reason: OutOfStockReason;
};

export type CreatePendingOrderResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      code:
        | "AUTH_REQUIRED"
        | "CART_EMPTY"
        | "OUT_OF_STOCK"
        | "CART_ITEM_INVALID_QTY"
        | "CHECKOUT_FAILED";
      outOfStock?: OutOfStockItem[];
    };

const OutOfStockItemSchema = z
  .object({
    fina_id: z.coerce.number().int(),
    code: z.string().nullable(),
    product_name: z.string().nullable(),
    title_ka: z.string().nullable(),
    title_en: z.string().nullable(),
    requested: z.coerce.number().int().nonnegative(),
    available: z.coerce.number().int().nonnegative(),
    rest: z.coerce.number(),
    reserved: z.coerce.number(),
    reason: z.enum(["reserved_temporarily", "no_stock", "insufficient"]),
  })
  .strict();

const OutOfStockListSchema = z.array(OutOfStockItemSchema);

function normalizeSupabaseErrorMessage(msg: string) {
  const m = msg.toUpperCase();

  if (m.includes("AUTH_REQUIRED")) return "AUTH_REQUIRED" as const;
  if (m.includes("CART_EMPTY")) return "CART_EMPTY" as const;
  if (m.includes("OUT_OF_STOCK")) return "OUT_OF_STOCK" as const;
  if (m.includes("CART_ITEM_INVALID_QTY")) return "CART_ITEM_INVALID_QTY" as const;

  return "CHECKOUT_FAILED" as const;
}

function parseOutOfStockDetails(details: unknown): OutOfStockItem[] | undefined {
  if (typeof details !== "string") return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(details);
  } catch {
    return undefined;
  }

  const r = OutOfStockListSchema.safeParse(parsed);
  return r.success ? r.data : undefined;
}

export async function createPendingOrder(
  input: CreateOrderInput,
): Promise<CreatePendingOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, code: "AUTH_REQUIRED" };

  const args: RpcArgs = {
    p_full_name: req(input.full_name, "full_name"),
    p_phone: req(input.phone, "phone"),

    p_line1: req(input.line1, "line1"),
    p_line2: norm(input.line2 ?? ""),
    p_city: req(input.city, "city"),
    p_region: norm(input.region ?? ""),

    p_shipping_address_id: input.shipping_address_id ?? null,
    p_reserve_minutes: 15,
  };

  const { data, error } = await supabase.rpc("create_pending_order_from_cart", args);

  if (error) {
    const code = normalizeSupabaseErrorMessage(error.message);
    if (code === "OUT_OF_STOCK") {
      const outOfStock = parseOutOfStockDetails(error.details);
      return { ok: false, code, outOfStock };
    }
    return { ok: false, code };
  }

  const orderId = z.string().uuid().safeParse(data);
  if (!orderId.success) return { ok: false, code: "CHECKOUT_FAILED" };

  return { ok: true, orderId: orderId.data };
}
