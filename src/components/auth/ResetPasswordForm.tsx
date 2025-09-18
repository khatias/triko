"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { makeAuthSchemas } from "@/lib/validation/auth";
import { PasswordField } from "../form/Field";
import { LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { handleResetPassword } from "@/utils/auth/handleResetPassword";

export default function ResetPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();

  // Build schemas with localized error messages
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type ResetPasswordInput = z.input<typeof schemas.resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", website: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const [message, setMessage] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ResetPasswordInput> = async (data) => {
    setMessage(null);
    const result = await handleResetPassword(data.password);

    if (result.ok) {
      setMessage(tForm("messages.passwordUpdated")); // e.g., "Your password has been updated. You can now log in."
    } else {
      setMessage(result.error ?? tForm("messages.genericError"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-labelledby="reset-title">
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

      <div className="mt-6 grid gap-3">
        <PasswordField
          id="password"
          autoComplete="new-password"
          label={tForm("fields.password")}
          icon={LockIcon}
          maxLength={72}
          {...register("password")}
          error={errors.password?.message}
          required
        />

        <PasswordField
          id="confirmPassword"
          autoComplete="new-password"
          label={tForm("fields.confirmPassword")}
          icon={LockIcon}
          maxLength={72}
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
          required
        />

        {/* Honeypot hidden field */}
        <input type="hidden" {...register("website")} />

        {/* Password requirements / hint */}
        <div className="text-xs leading-relaxed text-zinc-500">
          {tForm("notices.passwordHint")}
        </div>

        <div className="mt-1 text-center">
          <SubmitButton loading={isSubmitting} disabled={!isValid}>
            {isSubmitting
              ? tForm("actions.sending")
              : tForm("actions.updatePassword")}
          </SubmitButton>
        </div>

        {message && (
          <p className="mt-2 text-center text-sm text-rose-600">{message}</p>
        )}

        {/* Back to sign in */}
        <p className="mt-4 text-center text-sm text-zinc-700">
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-rose-600 underline-offset-4 hover:underline"
          >
            {tForm("links.backToLogin")}
          </Link>
        </p>
      </div>
    </form>
  );
}
