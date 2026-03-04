import React from "react";
import { createClient } from "@/utils/supabase/server";
import {
  addAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/addAddressAction";
import { AlertTriangleIcon, MapPinIcon } from "lucide-react";
import AddAddressCard from "@/components/address/AddAddressCard";
import { Button, RegularCard } from "@/components/UI/primitives";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Address = {
  id: string;
  user_id: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  is_default_shipping: boolean;
};

export default async function AddressesPage() {
  const t = await getTranslations("Profile.addresses");
  const tu = await getTranslations("Profile.account");

  const supabase = await createClient();
  const { data, error: claimsErr } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  // If this page is always wrapped by your protected ProfileLayout,
  // this should never render. Kept as a safe fallback.
  if (claimsErr || !userId) {
    return (
      <RegularCard className="flex items-start gap-3 border-l-4 border-amber-500 bg-amber-50 p-5">
        <AlertTriangleIcon className="mt-0.5 h-5 w-5 text-amber-600" />
        <div>
          <p className="text-base font-semibold text-amber-900">{tu("noUser")}</p>
        </div>
      </RegularCard>
    );
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("id,user_id,line1,line2,city,region,is_default_shipping")
    .eq("user_id", userId)
    .order("is_default_shipping", { ascending: false });

  const list = (addresses ?? []) as Address[];
  const hasAny = list.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="rounded-xl bg-gray-50 px-4 py-5">
        <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
        <p className="mt-2 text-slate-600">{t("subtitle")}</p>
      </header>

      {!hasAny ? (
        <section className="px-4 lg:px-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {t("noAddresses")}
            </p>

            <div className="mx-auto mt-8 max-w-sm">
              <AddAddressCard action={addAddressAction} wide />
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6 px-4 lg:px-0">
          <div className="order-1 md:order-last">
            <AddAddressCard action={addAddressAction} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {list.map((a) => (
              <RegularCard
                key={a.id}
                className={[
                  "relative rounded-2xl border bg-white p-6 transition-colors",
                  a.is_default_shipping
                    ? "border-emerald-500/50"
                    : "border-slate-200 hover:border-slate-300",
                ].join(" ")}
              >
                {a.is_default_shipping && (
                  <span className="pointer-events-none absolute right-4 top-4 inline-flex items-center rounded-full bg-[#fdd5a2] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-700 ring-1 ring-[#fdd5a2]">
                    {t("default")}
                  </span>
                )}

                <div className="min-w-0 space-y-1 mt-3">
                  <p className="wrap-break-word text-base font-semibold text-slate-900">
                    {a.line1}
                  </p>

                  {a.line2 && (
                    <p className="wrap-break-word text-sm text-slate-600">
                      {a.line2}
                    </p>
                  )}

                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                    <MapPinIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{a.city}</span>
                    {a.region ? <span>, {a.region}</span> : null}
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  {!a.is_default_shipping && (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-300"
                        aria-label="Set this address as default"
                      >
                        {t("setDefault")}
                      </Button>
                    </form>
                  )}

                  <form action={deleteAddressAction} className="ml-auto">
                    <input type="hidden" name="id" value={a.id} />
                    <Button
                      variant="subtle-danger"
                      className="border-rose-200 text-rose-700 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-200"
                      aria-label="Delete this address"
                    >
                      {t("delete")}
                    </Button>
                  </form>
                </div>
              </RegularCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}