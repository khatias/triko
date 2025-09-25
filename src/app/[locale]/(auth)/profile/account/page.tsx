import React from "react";
import { createClient } from "@/utils/supabase/server";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import CustomSelect from "@/components/form/CustomSelect"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-2xl border p-6">Please log in to edit your account.</div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const fullName = profile?.full_name ?? "";
  const phone = profile?.phone ?? "";
  const sex = (profile?.sex ?? "") as "" | "male" | "female";
  const birth_date = profile?.birth_date ?? "";
  const marketing = !!profile?.marketing_opt_in;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Account details</h2>

      <form action={updateProfileAction} className="grid gap-5">
        {/* Full name */}
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={fullName}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                       focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
            placeholder="Your full name"
            autoComplete="name"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={phone}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                       focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
            placeholder="+995 5XX XX XX XX"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        {/* Sex (custom, portal-based) */}
        <CustomSelect
          name="sex"
          label="Sex"
          options={[
            { value: "", label: "—" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
          defaultValue={sex}
        />

        {/* Birthday */}
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="birth_date">
            Birthday
          </label>
          <input
            id="birth_date"
            type="date"
            name="birth_date"
            defaultValue={birth_date}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                       focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
            inputMode="numeric"
          />
        </div>

        {/* Marketing opt-in */}
        <div className="md:col-span-2 flex items-center gap-3">
          <input
            id="marketing_opt_in"
            name="marketing_opt_in"
            type="checkbox"
            defaultChecked={marketing}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="marketing_opt_in" className="text-sm text-slate-700">
            I agree to receive marketing emails
          </label>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
