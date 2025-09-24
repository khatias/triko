"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updateProfileAction } from "@/app/actions/updateProfileAction";

// -------------------- Types --------------------
type Tab = "orders" | "account";

import { Profile } from "@/types/db";
// -------------------- Root --------------------
export default function ProfileShell({
  initialTab,
  profile,
}: {
  initialTab: Tab;
  profile: Profile;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [tab, setTab] = React.useState<Tab>(initialTab);

  // Sync tab with URL (write only when needed; remove when default "orders")
  React.useEffect(() => {
    const curr = (sp.get("tab") as Tab | null) ?? null;

    if (curr !== tab) {
      const params = new URLSearchParams(Array.from(sp.entries()));
      if (tab === "orders") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* SIDEBAR */}
      <aside className="lg:col-span-3">
        <nav className="space-y-2">
          <SidebarButton active={tab === "orders"} onClick={() => setTab("orders")}>
            Orders
          </SidebarButton>
          <SidebarButton active={tab === "account"} onClick={() => setTab("account")}>
            Account info
          </SidebarButton>
        </nav>
      </aside>

      {/* CONTENT */}
      <section className="lg:col-span-9">
        {tab === "orders" ? <OrdersPlaceholder /> : <AccountPanel profile={profile} />}
      </section>
    </div>
  );
}

// -------------------- UI Bits --------------------
function SidebarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-2 transition 
        ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function OrdersPlaceholder() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <p className="text-slate-600">Orders will appear here once available.</p>
    </div>
  );
}

function AccountPanel({ profile }: { profile: Profile }) {
  // Pre-normalize values to keep inputs controlled-ish without forcing state
  const fullName = profile?.full_name ?? "";
  const phone = profile?.phone ?? "";
  const sex = (profile?.sex ?? "") as "" | "male" | "female";
  const birth_date = profile?.birth_date ?? "";
  const marketing = !!profile?.marketing_opt_in;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Account details</h2>

      <form action={updateProfileAction} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="full_name">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={fullName}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Mariam Giorgadze"
            autoComplete="name"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={phone}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="+995 5XX XX XX XX"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="sex">
            Sex
          </label>
          <select
            id="sex"
            name="sex"
            defaultValue={sex}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          >
            <option value="">—</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600" htmlFor="birthday">
            Birthday
          </label>
          <input
            id="birth_date"
            type="date"
            name="birth_date"
            defaultValue={birth_date}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            // Helps mobile pickers
            inputMode="numeric"
          />
        </div>

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
          <SaveButton />
        </div>
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      aria-disabled={pending}
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}
