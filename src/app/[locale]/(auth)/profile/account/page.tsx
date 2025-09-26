import React from "react";
import { createClient } from "@/utils/supabase/server";
import { updateProfileAction } from "@/app/actions/updateProfileAction";
import { getTranslations } from "next-intl/server";
import AccountForm from "../_components/AccountForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AccountPage() {
  const t = await getTranslations("Profile");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-2xl border p-6">
        <p>{t("noUser")}</p>
      </div>
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
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 ">
      <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-medium"> {t("account.title")}</h2>

      <AccountForm
        updateProfileAction={updateProfileAction}
        fullName={fullName}
        phone={phone}
        sex={sex}
        birth_date={birth_date}
        marketing={marketing}
      />
    </div>
  );
}
