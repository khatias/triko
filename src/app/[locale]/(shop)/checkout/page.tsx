import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CheckoutFormClient from "./_components/CheckoutFormClient";

export const dynamic = "force-dynamic";

type AddressPrefill = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string | null;
  is_default_shipping: boolean;
  created_at: string;
};

function encNext(path: string) {
  return encodeURIComponent(path);
}

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

  // Auth-only checkout
  if (!user) {
    redirect(`/${locale}/login?next=${encNext(`/${locale}/checkout`)}`);
  }

  const { data: rows, error } = await supabase
    .from("addresses")
    .select("id,line1,line2,city,region,is_default_shipping,created_at")
    .eq("user_id", user.id)
    .eq("kind", "shipping")
    .order("is_default_shipping", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    // If address fetch fails, still render checkout (manual address entry)
    // Avoid throwing here to keep checkout usable.
    // You can log this if you want.
  }

  const savedAddresses: AddressPrefill[] = (rows ?? []).map((r) => ({
    id: r.id,
    line1: r.line1,
    line2: r.line2,
    city: r.city,
    region: r.region,
    is_default_shipping: r.is_default_shipping,
    created_at: r.created_at,
  }));

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <CheckoutFormClient locale={locale} savedAddresses={savedAddresses} />
    </div>
  );
}
