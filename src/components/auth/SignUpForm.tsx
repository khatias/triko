"use client";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { handleSignupSubmit } from "@/utils/auth/submit";
import { InputField, PasswordField } from "../form/Field";
import { formHeading } from "../UI/primitives";
import { LockIcon, UserIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { LegalNotice } from "./LegalNotice";
export default function SignUpForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);

  type SignUpInput = z.input<typeof schemas.signupSchema>;
  const locale = useLocale();

  const {
    register,
    formState: { errors, isSubmitting, isValid },
    reset,
    trigger,
  } = useForm<SignUpInput>({
    resolver: zodResolver(schemas.signupSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { website: "" } as Partial<SignUpInput>,
  });

  const emailReg = register("email");
  const passwordReg = register("password");
  const confirmReg = register("confirmPassword");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        setErrorMessage(null);
        setNoticeMessage(null);

        const result = await handleSignupSubmit(e, locale);

        if (!result.ok) {
          setErrorMessage(result.message ?? "");
          reset({ email: "", password: "", confirmPassword: "", website: "" });
          return;
        }

        setNoticeMessage(result.message ?? "");
        reset({ email: "", password: "", confirmPassword: "", website: "" });
      }}
    >
      {/* Error */}
      {errorMessage && (
        <div className="my-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
          <strong>{errorMessage}</strong>
        </div>
      )}

      {/* Success / Next step */}
      {noticeMessage && (
        <div className="my-8 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
          <strong>{noticeMessage}</strong>
        </div>
      )}

      <h2 className={formHeading}>
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("signUpTitle")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base pb-6">
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
          <SubmitButton
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? tForm("actions.sending") : tForm("actions.signUp")}
          </SubmitButton>
       
        </div>
      <LegalNotice />

        {/* 🔗 Sign In CTA */}
        <p className="mt-4 text-center text-sm text-zinc-700">
          {tForm("links.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-rose-600 underline-offset-4 hover:underline"
          >
            {tForm("actions.signIn")}
          </Link>
        </p>
      </div>
    </form>
  );
}
