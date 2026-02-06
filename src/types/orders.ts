export type DbOrder = {
  id: string;
  total: string | number;
  currency: string;
  status: "pending_payment" | "paid" | "failed" | "cancelled" | "fulfilled";
  bog_order_id: string | null;
  bog_payment_url: string | null;
};

export type DbOrderItem = {
  fina_id: number;
  quantity: number;
  unit_price: string | number;
  product_name: string | null;
};
