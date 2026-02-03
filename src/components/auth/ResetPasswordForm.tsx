"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { makeAuthSchemas } from "@/lib/validation/auth";
import { resetPasswordRequest } from "@/utils/auth/requests";

import { PasswordField } from "../form/Field";
import { LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { formHeading } from "../UI/primitives";

export default function ResetPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();

  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type ResetPasswordInput = z.infer<typeof schemas.resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "", website: "" },
  });

  const passwordReg = register("password");
  const confirmReg = register("confirmPassword");

  const [uiMessage, setUiMessage] = useState<{
    tone: "ok" | "err";
    text: string;
  } | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setUiMessage(null);

    const result = await resetPasswordRequest({
      locale,
      password: data.password,
      website: data.website,
    });

    if (!result.ok) {
      setUiMessage({
        tone: "err",
        text: result.message ?? tErrors("unknown"),
      });

      // keep nothing sensitive, but keep form state friendly
      reset(
        { password: "", confirmPassword: "", website: "" },
        { keepErrors: true, keepTouched: true },
      );

      return;
    }

    setUiMessage({
      tone: "ok",
      text: result.message ?? tForm("messages.passwordUpdated"),
    });

    reset({ password: "", confirmPassword: "", website: "" });

    router.replace(`/${locale}/profile`);
    router.refresh();
  });

  return (
    <form
      noValidate
      aria-busy={isSubmitting}
      onSubmit={onSubmit}
      aria-labelledby="reset-title"
    >
      <h2 id="reset-title" className={formHeading}>
        <span className="inline-block bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("resetPasswordTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base">
        {tForm("resetPasswordSubtitle")}
      </p>

      <div className="mt-4 grid">
        <PasswordField
          id="password"
          autoComplete="new-password"
          label={tForm("fields.password")}
          icon={LockIcon}
          maxLength={72}
          {...passwordReg}
          onChange={(e) => {
            passwordReg.onChange(e);
            void trigger("confirmPassword");
          }}
          error={errors.password?.message}
          required
        />

        <PasswordField
          id="confirmPassword"
          autoComplete="new-password"
          label={tForm("fields.confirmPassword")}
          icon={LockIcon}
          maxLength={72}
          {...confirmReg}
          error={errors.confirmPassword?.message}
          required
        />

        {/* Honeypot */}
        <input
          className="hidden"
          aria-hidden
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />

        <div className="text-xs leading-relaxed text-zinc-500">
          {tForm("notices.passwordHint")}
        </div>

        <div className="mt-1 text-center">
          <SubmitButton
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting
              ? tForm("actions.sending")
              : tForm("actions.updatePassword")}
          </SubmitButton>
        </div>

        {uiMessage && (
          <p
            role={uiMessage.tone === "err" ? "alert" : "status"}
            aria-live="polite"
            className={`mt-2 text-center text-sm ${
              uiMessage.tone === "ok" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {uiMessage.text}
          </p>
        )}

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
