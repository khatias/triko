import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CheckoutFormClient from "./_components/CheckoutFormClient";

export const dynamic = "force-dynamic";

export type AddressRow = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  is_default_shipping: boolean;
  created_at: string;
};

export type CartItemRow = {
  id: string;
  qty: number;
  variant_code: string | null;
  product_name: string;
  title_ka: string | null;
  title_en: string | null;
  price_at_add: number;
  image_url: string | null;
};
export type ProfileInfo = {
  full_name?: string | null;
  phone?: string | null;
};

export type SummaryInfo = {
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  total: number;
};
export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout`)}`,
    );
  }

  const { data: addresses, error: addrError } = await supabase
    .from("addresses")
    .select("id,line1,line2,city,region,is_default_shipping,created_at")
    .eq("user_id", user.id)
    .eq("kind", "shipping")
    .order("is_default_shipping", { ascending: false });

  if (addrError) throw addrError;

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, subtotal, discount_total, shipping_total, total")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cartError) throw cartError;

  const { data: cartItems, error: cartItemsError } = cart
    ? await supabase
        .from("cart_items")
        .select(
          "id,qty,variant_code,product_name,title_ka,title_en,price_at_add,image_url",
        )
        .eq("cart_id", cart.id)
        .order("created_at", { ascending: true })
    : { data: [] as CartItemRow[], error: null as null };

  if (cartItemsError) throw cartItemsError;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  return (
    <div className="min-h-screen bg-[#F9F9F9] py-12 px-4 md:px-6">
      <div className="mx-auto max-w-275">
        <div className="mb-10 flex items-center justify-between border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Checkout
          </h1>
        </div>

        <CheckoutFormClient
          locale={locale}
          savedAddresses={(addresses ?? []) as AddressRow[]}
          cartItems={(cartItems ?? []) as CartItemRow[]}
          profileInfo={{
            full_name: profile?.full_name ?? null,
            phone: profile?.phone ?? null,
          }}
          summary={{
            subtotal: cart?.subtotal ?? 0,
            discount_total: cart?.discount_total ?? 0,
            shipping_total: cart?.shipping_total ?? 0,
            total: cart?.total ?? 0,
          }}
        />
      </div>
    </div>
  );
}
