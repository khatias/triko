"use client";
import * as React from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import CustomSelect from "@/components/form/CustomSelect";

interface AccountFormProps {
  updateProfileAction: (
    prevState: { error?: string } | undefined,
    formData: FormData
  ) => Promise<{ error?: string }>;
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

  const [state, formAction] = React.useActionState(updateProfileAction, {
    error: undefined,
  });
  if (state.error?.includes("birth_date_must_be_valid")) {
    state.error = t("account.birthDateInvalid");
  }
  function SaveButton() {
    const { pending } = useFormStatus();
    return (
      <button
        type="submit"
        className="inline-flex items-center rounded-xl bg-[#172a3e] px-4 py-2 text-white shadow-sm hover:bg-[#1c3b57] disabled:opacity-60 cursor-pointer disabled:pointer-events-none transition"
        disabled={pending}
      >
        {pending ? t("actions.saving") : t("actions.save")}
      </button>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      {/* Error banner */}

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

      {/* Sex */}
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

      {/* Marketing */}
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
           {state.error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {state.error}
          </p>
        )}
    </form>
  );
};

export default AccountForm;
