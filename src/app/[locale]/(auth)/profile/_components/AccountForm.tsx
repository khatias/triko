"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import CustomSelect from "@/components/form/CustomSelect";

interface AccountFormProps {
  updateProfileAction: (formData: FormData) => void;
  fullName: string;
  phone: string;
  sex: "" | "male" | "female";
  birth_date: string;
  marketing: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({
  updateProfileAction,
  fullName,
  phone,
  sex,
  birth_date,
  marketing,
}) => {
  const t = useTranslations("Profile");
  function SaveButton() {
    const { pending } = useFormStatus();
    return (
      <button
        type="submit"
        className="inline-flex items-center rounded-xl bg-orange-600 px-4 py-2 text-white shadow-sm hover:bg-orange-700 disabled:opacity-60 cursor-pointer disabled:pointer-events-none transition"
        disabled={pending}
      >
        {pending ? t("actions.saving") : t("actions.save")}
      </button>
    );
  }
  return (
    <form action={updateProfileAction} className="grid gap-5">
      {/* Full name */}
      <div>
        <label
          className="mb-1 block text-sm text-slate-600"
          htmlFor="full_name"
        >
          {t("account.fullName")}
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                                         focus:outline-none focus:ring-1 focus:ring-[#fdd5a2] focus:border-[#fdd5a2]"
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="mb-1 block text-sm text-slate-600" htmlFor="phone">
          {t("account.phone")}
        </label>
        <input
          id="phone"
          name="phone"
          defaultValue={phone}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                     focus:outline-none focus:ring-1 focus:ring-[#fdd5a2] focus:border-[#fdd5a2]"
          placeholder="+995 5XX XX XX XX"
          inputMode="tel"
          autoComplete="tel"
          type="tel"
          pattern="[0-9]{9}"
          minLength={9}
          maxLength={9}
        />
      </div>

      {/* Sex (custom, portal-based) */}
      <CustomSelect
        name="sex"
        label="Sex"
        options={[
          { value: "", label: "—" },
          { value: "male", label: t("account.male") },
          { value: "female", label: t("account.female") },
        ]}
        defaultValue={sex}
      />

      {/* Birthday */}
      <div>
        <label
          className="mb-1 block text-sm text-slate-600"
          htmlFor="birth_date"
        >
          {t("account.birthdate")}
        </label>
        <input
          id="birth_date"
          type="date"
          name="birth_date"
          defaultValue={birth_date}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 bg-white
                                         focus:outline-none focus:ring-1 focus:ring-[#fdd5a2] focus:border-[#fdd5a2]"
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
          {t("account.marketingOptIn")}
        </label>
      </div>

      <div className="md:col-span-2">
        <SaveButton />
      </div>
    </form>
  );
};

export default AccountForm;
