"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { makeAuthSchemas } from "@/lib/validation/auth";

import { InputField } from "../form/Field";
import { UserIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";

export default function ForgotPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);

  type ForgotPasswordInput = z.input<typeof schemas.forgotPasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schemas.forgotPasswordSchema),
    defaultValues: { website: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  async function onSubmit(raw: ForgotPasswordInput) {
    const data = schemas.forgotPasswordSchema.parse(raw);
    console.log("Forgot password submit:", data);

    // TODO: Call your API endpoint for password reset
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <h2
        id="forgot-title"
        className="
          relative mb-3 text-center text-3xl sm:text-4xl font-semibold
          tracking-tight text-zinc-900 [text-wrap:balance] selection:bg-[#fdd5a2]/30
          after:content-[''] after:mt-3 after:block after:h-[3px]
          after:w-20 sm:after:w-28 after:mx-auto after:rounded-full
          after:bg-gradient-to-r after:from-[#fdd5a2] after:via-rose-300/70 after:to-[#fdd5a2]
        "
      >
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("forgotPasswordTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base pt-6">
        {tForm("forgotPasswordSubtitle")}
      </p>

      <div className="mt-6 grid">
        <InputField
          id="reset-email"
          type="email"
          label={tForm("fields.email")}
          icon={UserIcon }
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
