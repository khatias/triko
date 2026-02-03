// src/components/auth/SignUpForm.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { makeAuthSchemas } from "@/lib/validation/auth";
import { signupRequest } from "@/utils/auth/requests";

import { InputField, PasswordField } from "../form/Field";
import { formHeading } from "../UI/primitives";
import { LockIcon, UserIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { LegalNotice } from "./LegalNotice";

export default function SignUpForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const tAuth = useTranslations("Auth");
  const locale = useLocale();

  const schemas = useMemo(
    () => makeAuthSchemas((k) => tErrors?.(k) ?? k),
    [tErrors],
  );

  type SignUpInput = z.input<typeof schemas.signupSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    trigger,
    getValues,
  } = useForm<SignUpInput>({
    resolver: zodResolver(schemas.signupSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirmPassword: "",
      website: "",
    } as Partial<SignUpInput>,
  });

  const emailReg = register("email");
  const passwordReg = register("password");
  const confirmReg = register("confirmPassword");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    setNoticeMessage(null);

    const result = await signupRequest({
      locale,
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      website: data.website ?? "",
    });

    if (!result.ok) {
      setErrorMessage(result.message ?? tForm("errors.unknown"));

      // keep email + name, clear sensitive fields
      reset(
        {
          email: getValues("email"),
          full_name: getValues("full_name"),
          password: "",
          confirmPassword: "",
          website: "",
        } as Partial<SignUpInput>,
        { keepErrors: true, keepTouched: true },
      );

      return;
    }

    setNoticeMessage(result.message ?? tAuth("signupSuccessGeneric"));

    // clear passwords; keep email/name so user can re-check
    reset(
      {
        email: getValues("email"),
        full_name: getValues("full_name"),
        password: "",
        confirmPassword: "",
        website: "",
      } as Partial<SignUpInput>,
      { keepErrors: true, keepTouched: true },
    );
  });

  return (
    <form noValidate aria-busy={isSubmitting} onSubmit={onSubmit}>
      {/* Error */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="my-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
        >
          <strong>{errorMessage}</strong>
        </div>
      )}

      {/* Success / Next step */}
      {noticeMessage && (
        <div
          role="status"
          aria-live="polite"
          className="my-8 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700"
        >
          <strong>{noticeMessage}</strong>
        </div>
      )}

      <h2 className={formHeading}>
        <span className="inline-block bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("signUpTitle")}
        </span>
      </h2>

      <p className="pb-6 text-center text-sm text-zinc-600 sm:text-base">
        {tForm("signUpSubtitle")}
      </p>

      <div className="grid">
        <InputField
          id="email"
          type="email"
          autoComplete="email"
          label={tForm("fields.email")}
          icon={UserIcon}
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          {...emailReg}
          error={errors.email?.message}
          required
        />

        <InputField
          id="full_name"
          type="text"
          autoComplete="name"
          label={tForm("fields.fullName")}
          icon={UserIcon}
          inputMode="text"
          autoCapitalize="words"
          spellCheck={false}
          maxLength={100}
          {...register("full_name")}
          error={errors.full_name?.message}
          required
        />

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
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          {...register("website")}
        />

        <div className="mt-2 text-center">
          <SubmitButton loading={isSubmitting} disabled={!isValid || isSubmitting}>
            {isSubmitting ? tForm("actions.sending") : tForm("actions.signUp")}
          </SubmitButton>
        </div>

        <LegalNotice />

        <p className="mt-4 text-center text-sm text-zinc-700">
          {tForm("links.haveAccount")}{" "}
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-rose-600 underline-offset-4 hover:underline"
          >
            {tForm("actions.signIn")}
          </Link>
        </p>
      </div>
    </form>
  );
}
