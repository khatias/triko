"use client";
import { useLocale } from "next-intl";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { InputField, PasswordField } from "../form/Field";
import { LockIcon, UserIcon } from "../form/icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { makeAuthSchemas } from "@/lib/validation/auth";
import SubmitButton from "../form/SubmitButton";
import Link from "next/link";
import { handleSignupSubmit } from "@/utils/auth/handleAuthSubmit";
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

      <h2 className="relative mx-auto mb-6 max-w-2xl text-center text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-wide text-zinc-900 [text-wrap:balance] selection:bg-[#fdd5a2]/30 before:content-[''] before:absolute before:inset-x-1/3 before:-bottom-1 before:h-6 before:rounded-full before:bg-[#fdd5a2]/20 before:blur-xl before:-z-10 after:content-[''] after:mt-4 after:block after:h-[3px] after:w-16 sm:after:w-24 after:rounded-full after:mx-auto after:bg-gradient-to-r after:from-[#fdd5a2] after:via-rose-300/70 after:to-[#fdd5a2]">
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

          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            {tForm("notices.trustEmailPrivacy")}
          </p>
        </div>

        {/* Legal */}
        <p className="mt-3 text-center text-xs leading-relaxed text-zinc-500">
          {tForm.rich("legal.notice", {
            terms: (chunk) => (
              <Link
                href="/terms"
                className="underline underline-offset-2 hover:text-rose-600"
              >
                {chunk}
              </Link>
            ),
            privacy: (chunk) => (
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-rose-600"
              >
                {chunk}
              </Link>
            ),
          })}
        </p>

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
