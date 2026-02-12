import { requireAdmin } from "@/utils/auth/requireAdmin";

type OrderRow = {
  id: string;
  order_code: string | null;

  created_at: string;
  updated_at: string | null;

  user_id: string | null;
  status: string;

  currency: string | null;
  items_count: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;

  shipping_full_name: string | null;
  shipping_phone: string | null;
  shipping_line1: string | null;
  shipping_line2: string | null;
  shipping_city: string | null;
  shipping_region: string | null;

  shipping_status: string | null;

  paid_at: string | null;
  payment_expires_at: string | null;

  bog_order_id: string | null;
  bog_payment_id: string | null;
  bog_status: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  fina_id: number;
  code: string | null;
  product_name: string | null;
  name_en: string | null;
  name_ka: string | null;
  variant_name: string | null;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  currency: string | null;
};

type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string | null;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  created_at: string;
};

const ORDER_SELECT =
  "id, order_code, created_at, updated_at, user_id, status, currency, items_count, subtotal, discount_total, shipping_total, total, shipping_full_name, shipping_phone, shipping_line1, shipping_line2, shipping_city, shipping_region, shipping_status, paid_at, payment_expires_at, bog_order_id, bog_payment_id, bog_status" as const;

const ITEMS_SELECT =
  "id, order_id, fina_id, code, product_name, name_en, name_ka, variant_name, image_url, quantity, unit_price, line_total, currency" as const;

const PAYMENT_SELECT =
  "id, order_id, provider, status, amount, currency, provider_payment_id, provider_order_id, created_at" as const;

export async function fetchOrderData(locale: string, orderId: string) {
  const { supabase } = await requireAdmin(locale);

  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !orderData) {
    return { order: null as OrderRow | null, items: [], payment: null };
  }

  const [itemsRes, paymentRes] = await Promise.all([
    supabase
      .from("order_items")
      .select(ITEMS_SELECT)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),

    supabase
      .from("order_payments")
      .select(PAYMENT_SELECT)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    order: orderData as OrderRow,
    items: (itemsRes.data ?? []) as OrderItemRow[],
    payment: (paymentRes.data ?? null) as PaymentRow | null,
  };
}
