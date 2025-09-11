"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PasswordField } from "../form/Field";
import { LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import Link from "next/link";

export default function ResetPasswordForm() {
  const tForm = useTranslations("Form");

  // UI-only placeholders so SubmitButton renders without wiring up react-hook-form
  const isSubmitting = false;
  const isValid = true;

  return (
    <form noValidate aria-labelledby="reset-title">
      <h2
        id="reset-title"
        className="
          relative mb-3 text-center text-3xl sm:text-4xl font-semibold
          tracking-tight text-zinc-900 [text-wrap:balance] selection:bg-[#fdd5a2]/30
          after:content-[''] after:mt-3 after:block after:h-[3px]
          after:w-20 sm:after:w-28 after:mx-auto after:rounded-full
          after:bg-gradient-to-r after:from-[#fdd5a2] after:via-rose-300/70 after:to-[#fdd5a2]
        "
      >
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("resetPasswordTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base">
        {tForm("resetPasswordSubtitle")}
      </p>

      <div className="mt-6 grid">
        <PasswordField
          id="new-password"
          name="password"
          autoComplete="new-password"
          label={tForm("fields.newPassword")}
          icon={LockIcon}
          required
        />

        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          autoComplete="new-password"
          label={tForm("fields.confirmPassword")}
          icon={LockIcon}
          required
        />

        {/* Password requirements / hint */}
        <div className=" text-xs leading-relaxed text-zinc-500">
          {tForm("notices.passwordHint")}
        </div>

        <div className="mt-1 text-center">
          <SubmitButton loading={isSubmitting} disabled={!isValid}>
            {tForm("actions.updatePassword")}
          </SubmitButton>
        </div>

        {/* Back to sign in */}
        <p className="mt-4 text-center text-sm text-zinc-700">
          <Link
            href="/login"
            className="font-semibold text-rose-600 underline-offset-4 hover:underline"
          >
            {tForm("links.backToLogin")}
          </Link>
        </p>
      </div>
    </form>
  );
}
