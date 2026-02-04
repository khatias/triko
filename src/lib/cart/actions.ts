"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  isObject,
  isString,
  asNullableString,
  asNullableMoneyString,
  asNullableInt,
  asMoneyString,
  asInt,
} from "@/utils/type-guards";
import { getTranslations } from "next-intl/server";
const CART_COOKIE = "cart_token";

/* =========================
   Result Types
========================= */
type ActionOk = { ok: true };
type ActionErr = { ok: false; message: string; kind: "stock" | "unknown" };
export type ActionResult = ActionOk | ActionErr;

/* =========================
   DB Types
========================= */
export type CartRow = {
  id: string;
  user_id: string | null;
  cart_token: string;
  status: string;
  currency: string;
  items_count: number;
  subtotal: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  store_id: number;
  price_id: number | null;
};

export type CartItemRow = {
  id: string;
  cart_id: string;

  fina_id: number;
  qty: number;

  price_at_add: string;
  list_price_at_add: string | null;

  parent_code: string | null;

  title_en: string | null;
  title_ka: string | null;

  product_name: string | null;
  variant_size: string | null;
  variant_code: string | null;

  image_url: string | null;
};

export type CartState = {
  cart: CartRow;
  items: CartItemRow[];
};

/* =========================
   Helpers
========================= */
function normalizeSupabaseErrorMessage(msg: string): string {
  // Keep this conservative: just normalize whitespace + case checks elsewhere
  return (msg ?? "UNKNOWN").trim();
}

async function classifyRpcError(message: string): Promise<ActionErr> {
  const raw = normalizeSupabaseErrorMessage(message);
  const m = raw.toLowerCase();
  const t = await getTranslations("Cart.errors");
  // Our SQL raises exactly: OUT_OF_STOCK
  if (m.includes("out_of_stock")) {
    return { ok: false, kind: "stock", message: t("notEnoughStock") };
  }

  // Older versions used different text
  if (m.includes("not enough stock")) {
    return { ok: false, kind: "stock", message: t("notEnoughStock") };
  }

  return { ok: false, kind: "unknown", message: "Something went wrong" };
}

function parseCartRow(v: unknown): CartRow {
  if (!isObject(v)) throw new Error("cart_read_v2: cart is not an object");

  const id = v.id;
  const user_id = v.user_id;
  const cart_token = v.cart_token;
  const status = v.status;
  const currency = v.currency;

  if (!isString(id)) throw new Error("cart_read_v2: cart.id invalid");
  if (!(user_id === null || isString(user_id)))
    throw new Error("cart_read_v2: cart.user_id invalid");
  if (!isString(cart_token))
    throw new Error("cart_read_v2: cart.cart_token invalid");
  if (!isString(status)) throw new Error("cart_read_v2: cart.status invalid");
  if (!isString(currency))
    throw new Error("cart_read_v2: cart.currency invalid");

  return {
    id,
    user_id,
    cart_token,
    status,
    currency,
    items_count: asInt(v.items_count, "cart.items_count"),
    subtotal: asMoneyString(v.subtotal, "cart.subtotal"),
    discount_total: asMoneyString(v.discount_total, "cart.discount_total"),
    shipping_total: asMoneyString(v.shipping_total, "cart.shipping_total"),
    total: asMoneyString(v.total, "cart.total"),
    store_id: asInt(v.store_id, "cart.store_id"),
    price_id: asNullableInt(v.price_id, "cart.price_id"),
  };
}

function parseCartItemRow(v: unknown): CartItemRow {
  if (!isObject(v)) throw new Error("cart_read_v2: item is not an object");

  const id = v.id;
  const cart_id = v.cart_id;

  if (!isString(id)) throw new Error("cart_read_v2: item.id invalid");
  if (!isString(cart_id)) throw new Error("cart_read_v2: item.cart_id invalid");

  return {
    id,
    cart_id,

    fina_id: asInt(v.fina_id, "item.fina_id"),
    qty: asInt(v.qty, "item.qty"),

    price_at_add: asMoneyString(v.price_at_add, "item.price_at_add"),
    list_price_at_add: asNullableMoneyString(
      v.list_price_at_add,
      "item.list_price_at_add",
    ),

    parent_code: asNullableString(v.parent_code),

    title_en: asNullableString(v.title_en),
    title_ka: asNullableString(v.title_ka),

    product_name: asNullableString(v.product_name),
    variant_size: asNullableString(v.variant_size),
    variant_code: asNullableString(v.variant_code),

    image_url: asNullableString(v.image_url),
  };
}

function parseCartReadResponse(payload: unknown): CartState {
  if (!isObject(payload))
    throw new Error("cart_read_v2: payload is not an object");

  const cartRaw = payload.cart;
  const itemsRaw = payload.items;

  const cart = parseCartRow(cartRaw);

  if (!Array.isArray(itemsRaw))
    throw new Error("cart_read_v2: items is not an array");
  const items = itemsRaw.map(parseCartItemRow);

  return { cart, items };
}

async function getCartToken(): Promise<string> {
  const store = await cookies();
  const token = store.get(CART_COOKIE)?.value ?? null;

  if (!token) {
    throw new Error("cart_token cookie missing. Check middleware sets it.");
  }

  return token;
}

function clampQty(qty: number, min: number): number {
  if (!Number.isFinite(qty)) return min;
  return Math.max(min, Math.floor(qty));
}

/* =========================
   Actions
========================= */

export async function getCartState(): Promise<CartState> {
  const supabase = await createClient();
  const token = await getCartToken();

  const { data, error } = await supabase.rpc("cart_read_v2", {
    p_cart_token: token,
  });

  if (error) throw new Error(error.message);

  return parseCartReadResponse(data as unknown);
}

export async function addToCart(
  locale: string,
  finaId: number,
  qty = 1,
): Promise<ActionResult> {
  const supabase = await createClient();
  const token = await getCartToken();

  const safeQty = clampQty(qty, 1);

  const { error } = await supabase.rpc("cart_add_item_by_fina", {
    p_cart_token: token,
    p_fina_id: finaId,
    p_qty: safeQty,
  });

  if (error) {
    return await classifyRpcError(error.message);
  }

  revalidatePath(`/${locale}/cart`);
  return { ok: true };
}

export async function updateCartQty(
  locale: string,
  finaId: number,
  qty: number,
): Promise<ActionResult> {
  const supabase = await createClient();
  const token = await getCartToken();

  const safeQty = Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0;

  const { error } = await supabase.rpc("cart_set_qty_by_fina", {
    p_cart_token: token,
    p_fina_id: finaId,
    p_qty: safeQty,
  });

  if (error) {
    return classifyRpcError(error.message);
  }

  revalidatePath(`/${locale}/cart`);
  return { ok: true };
}

export async function removeCartItem(
  locale: string,
  finaId: number,
): Promise<ActionResult> {
  return updateCartQty(locale, finaId, 0);
}
