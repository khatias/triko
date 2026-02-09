import React from "react";
import { createClient } from "@/utils/supabase/server";
import OrdersClients from "./OrdersClients";
import { toNumber, isPaidStatus } from "@/utils/type-guards";

export type ShippingStatus = "confirmed" | "in_transit" | "delivered";

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

type OrderRow = {
  id: string;
  status: string;
  shipping_status: ShippingStatus | string | null;
  items_count: number;
  subtotal: number | string | null;
  discount_total: number | string | null;
  total: number | string | null;
  created_at: string;
  currency?: string | null;
};

function isShippingStatus(v: unknown): v is ShippingStatus {
  return v === "confirmed" || v === "in_transit" || v === "delivered";
}

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <OrdersClients view="unauth" />;
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,status,shipping_status,items_count,subtotal,discount_total,total,created_at,currency",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <OrdersClients view="error" />;
  }

  const rows = (data ?? []) as OrderRow[];

  // ✅ keep ONLY paid orders (status-based)
  const paidRows = rows.filter((o) => isPaidStatus(o.status));

  const orders: OrderType[] = paidRows.map((o) => ({
    id: o.id,
    status: o.status,
    shipping_status: isShippingStatus(o.shipping_status) ? o.shipping_status : null,
    items_count: o.items_count ?? 0,
    subtotal: toNumber(o.subtotal ?? 0),
    discount_total: toNumber(o.discount_total ?? 0),
    total: toNumber(o.total ?? 0),
    created_at: o.created_at,
    currency: o.currency ?? null,
  }));

  return <OrdersClients myOrders={orders} view="ok" />;
}
