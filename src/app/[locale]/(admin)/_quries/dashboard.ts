import { requireAdmin } from "@/utils/auth/requireAdmin";

export type AdminDashboardStats = {
  revenue30d: number;
  orders30d: number;
  productsCount: number;
  currency: string;
  customersCount: number;
  newCustomers30d: number;
};

export type AdminRecentOrder = {
  id: string;
  created_at: string;
  total: number;
  currency: string;
  status: string;
};

export async function fetchAdminDashboard(locale: string) {
  const { supabase } = await requireAdmin(locale);

  // PRODUCTS COUNT
  const productsRes = await supabase
    .from("shop_catalog_admin_parent_view")
    .select("parent_code", { count: "exact", head: true });

  const productsCount = productsRes.count ?? 0;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // ORDERS + REVENUE (last 30 days)
  const ordersRes = await supabase
    .from("orders")
    .select("id, created_at, total, currency, status")
    .gte("created_at", since)
    .in("status", ["paid"]);

  const orders30d = ordersRes.data?.length ?? 0;
  const revenue30d =
    ordersRes.data?.reduce((sum, o) => sum + Number(o.total ?? 0), 0) ?? 0;

  const recentOrders: AdminRecentOrder[] =
    (ordersRes.data ?? [])
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 6)
      .map((o) => ({
        id: String(o.id),
        created_at: String(o.created_at),
        total: Number(o.total ?? 0),
        currency: String(o.currency ?? "GEL"),
        status: String(o.status ?? ""),
      })) ?? [];

  // CUSTOMERS (profiles)
  // Assumes profiles has created_at. If your column name differs, tell me and I’ll adjust.
  const customersCountRes = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  const newCustomersRes = await supabase
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", since);

  const customersCount = customersCountRes.count ?? 0;
  const newCustomers30d = newCustomersRes.count ?? 0;

  const currency =
    ordersRes.data && ordersRes.data.length > 0
      ? String(ordersRes.data[0].currency ?? "GEL")
      : "GEL";

  const stats: AdminDashboardStats = {
    revenue30d,
    orders30d,
    productsCount,
    customersCount,
    newCustomers30d,
    currency,
  };

  return { stats, recentOrders };
}
