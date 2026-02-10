import { requireAdmin } from "@/utils/auth/requireAdmin";

type OrderRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: string;
  currency: string;
  items_count: number;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;

  shipping_full_name: string;
  shipping_phone: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
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
  currency: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  created_at: string;
};

export async function fetchOrderData(locale: string, orderId: string) {
  const { supabase } = await requireAdmin(locale);
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderErr) return { order: null, items: [], payment: null };

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "id, order_id, fina_id, code, product_name, name_en, name_ka, variant_name, image_url, quantity, unit_price, line_total, currency",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const { data: payment } = await supabase
    .from("order_payments")
    .select(
      "id, order_id, provider, status, amount, currency, provider_payment_id, provider_order_id, created_at",
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    order: order as OrderRow,
    items: (items ?? []) as OrderItemRow[],
    payment: (payment ?? null) as PaymentRow | null,
  };
}
