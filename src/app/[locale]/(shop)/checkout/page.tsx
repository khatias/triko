// src/app/[locale]/(shop)/checkout/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CheckoutFormClient from "./_components/CheckoutFormClient";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "Checkout",
    path: "/checkout",
  });
}

export type ShippingZone = "tbilisi" | "region_city" | "region_village";

export type AddressRow = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  is_default_shipping: boolean;
  created_at: string;
  shipping_zone: ShippingZone;
};

export type CartItemRow = {
  id: string;
  qty: number;
  variant_code: string | null;
  variant_name?: string | null;
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
    .select("id,line1,line2,city,region,is_default_shipping,created_at,shipping_zone")
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
          "id,qty,variant_code,variant_name,product_name,title_ka,title_en,price_at_add,image_url",
        )
        .eq("cart_id", cart.id)
        .order("created_at", { ascending: true })
    : { data: [] as CartItemRow[], error: null as null };

  if (cartItemsError) throw cartItemsError;

  if (!cartItems || cartItems.length === 0) {
    redirect(`/${locale}/cart`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20 px-4 md:px-6 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl">
        <CheckoutFormClient
          locale={locale}
          savedAddresses={(addresses ?? []) as AddressRow[]}
          cartItems={(cartItems ?? []) as CartItemRow[]}
          profileInfo={{
            full_name: profile?.full_name ?? null,
            phone: profile?.phone ?? null,
          }}
          summary={{
            subtotal: Number(cart?.subtotal ?? 0),
            discount_total: Number(cart?.discount_total ?? 0),
            shipping_total: Number(cart?.shipping_total ?? 0),
            total: Number(cart?.total ?? 0),
          }}
        />
      </div>
    </div>
  );
}
