"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { handleForgotPasswordSubmit } from "@/utils/auth/handleForgotPassword";
import { InputField } from "../form/Field";
import { UserIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { formHeading } from "../UI/primitives";
export default function ForgotPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  const locale = useLocale();
  type ForgotPasswordInput = z.input<typeof schemas.forgotPasswordSchema>;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const {
    register,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schemas.forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { website: "" } as Partial<ForgotPasswordInput>,
  });

  return (
    <form
      onSubmit={async (e) => {
        setErrorMessage(null);
        setNoticeMessage(null);

        const result = await handleForgotPasswordSubmit(e, locale);

        if (!result.ok) {
          setErrorMessage(result.message ?? "");
          reset({ email: "", website: "" });
          return;
        }

        setNoticeMessage(result.message ?? "");
        reset({ email: "", website: "" });
      }}
    >
      {errorMessage && (
        <p className="mb-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      )}
      {noticeMessage && (
        <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-center text-emerald-700">
          {noticeMessage}
        </p>
      )}
      <h2 id="forgot-title" className={formHeading}>
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("forgotPasswordTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base pt-2">
        {tForm("forgotPasswordSubtitle")}
      </p>

      <div className="mt-4 grid">
        <InputField
          id="reset-email"
          type="email"
          label={tForm("fields.email")}
          icon={UserIcon}
          error={errors.email?.message}
          required
          {...register("email")}
        />

        {/* Honeypot hidden field */}
        <input type="hidden" {...register("website")} />

        <div className="mt-1 text-center">
          <SubmitButton disabled={!isValid} loading={isSubmitting}>
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
