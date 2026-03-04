"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { makeAuthSchemas } from "@/lib/validation/auth";
import { forgotPasswordRequest } from "@/utils/auth/requests";
import { InputField } from "../form/Field";
import { UserIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { formHeading } from "../UI/primitives";

export default function ForgotPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();

  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type ForgotPasswordInput = z.infer<typeof schemas.forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schemas.forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      website: "",
    },
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    setNoticeMessage(null);

    const result = await forgotPasswordRequest({
      locale,
      email: data.email,
      website: data.website,
    });

    if (!result.ok) {
      setErrorMessage(result.message ?? tErrors("unknown"));

      // ✅ keep email, clear honeypot
      reset(
        { email: getValues("email"), website: "" },
        { keepErrors: true, keepTouched: true },
      );
      return;
    }

    setNoticeMessage(result.message ?? tForm("notices.resetLinkSent"));

    // ✅ keep email (optional). If you want empty email on success, set email: ""
    reset({ email: getValues("email"), website: "" });
  });

  return (
    <form noValidate aria-busy={isSubmitting} onSubmit={onSubmit}>
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          <strong>{errorMessage}</strong>
        </div>
      )}

      {noticeMessage && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-center text-emerald-700"
        >
          <strong>{noticeMessage}</strong>
        </div>
      )}

      <h2 id="forgot-title" className={formHeading}>
        <span className="inline-block bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("forgotPasswordTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base pt-2">
        {tForm("forgotPasswordSubtitle")}
      </p>

      <div className="mt-4 grid">
        <InputField
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          label={tForm("fields.email")}
          icon={UserIcon}
          error={errors.email?.message}
          required
          maxLength={254}
          {...register("email")}
        />

        {/* Honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          {...register("website")}
        />

        <div className="mt-1 text-center">
          <SubmitButton disabled={!isValid || isSubmitting} loading={isSubmitting}>
            {tForm("actions.sendResetLink")}
          </SubmitButton>

          <p className="mt-3 text-xs text-zinc-500">
            {tForm("notices.resetHelp")}
          </p>
        </div>

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
