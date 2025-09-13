"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { z } from "zod";
import { InputField, PasswordField } from "../form/Field";
import { UserIcon, LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { GoogleMark } from "../form/icons";

export default function LoginForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);

  type LoginInput = z.infer<typeof schemas.loginSchema>;

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting, isValid },
} = useForm<LoginInput>({
  resolver: zodResolver(schemas.loginSchema),
  mode: "onChange",
  criteriaMode: "all", // ✅ collect all issues per field
});


  function onSubmit(data: LoginInput) {
    // UI-only for now
    console.log("Login (UI-only):", data);
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <h2
        className="
          relative mx-auto mb-6 max-w-2xl text-center
          text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-wide text-zinc-900
          [text-wrap:balance] selection:bg-[#fdd5a2]/30
          before:content-[''] before:absolute before:inset-x-1/3 before:-bottom-1 before:h-6
          before:rounded-full before:bg-[#fdd5a2]/20 before:blur-xl before:-z-10
          after:content-[''] after:mt-4 after:block after:h-[3px]
          after:w-16 sm:after:w-24 after:rounded-full after:mx-auto
          after:bg-gradient-to-r after:from-[#fdd5a2] after:via-rose-300/70 after:to-[#fdd5a2]
        "
      >
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tForm("loginTitle")}
        </span>
      </h2>

      {/* Google authentication */}
      <div>
        <button
          type="button"
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300/80 bg-white/70 px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm"
        >
          <GoogleMark />
          <span className="translate-x-0 transition group-hover:translate-x-[1px]">
            {tForm("actions.google")}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="my-6">
        <div className="flex justify-center">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            {tForm("ui.or")}
          </span>
        </div>
      </div>

      {/* Email + Password */}
      <div className="grid gap-4">
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
          {...register("email")}
          error={errors.email?.message}
        />

        <div>
          <PasswordField
            id="password"
            label={tForm("fields.password")}
            icon={LockIcon}
            autoComplete="current-password"
            maxLength={72}
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="mt-2 flex items-center justify-between">
            <label className="inline-flex select-none items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 text-rose-600 accent-rose-600 focus:ring-rose-300"
              />
              <span>{tForm("links.rememberMe")}</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm text-rose-600 underline-offset-4 hover:underline"
            >
              {tForm("links.forgotPassword")}
            </Link>
          </div>
        </div>
      </div>

      {/* Honeypot (anti-bot) */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        {...register("website")}
      />

      {/* Primary action */}
      <div className="mt-2">
        <SubmitButton loading={isSubmitting} disabled={!isValid}>
          {isSubmitting ? tForm("actions.sending") : tForm("actions.signIn")}
        </SubmitButton>

        {/* Trust note */}
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="fill-none stroke-current"
            aria-hidden="true"
          >
            <path
              d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"
              strokeWidth="1.4"
            />
            <path
              d="M9 12l2 2 4-4"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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

      {/* 🔗 Sign up CTA */}
      <p className="mt-4 text-center text-sm text-zinc-700">
        {tForm("links.dontHaveAccount")}{" "}
        <Link
          href="/signup"
          className="font-semibold text-rose-600 underline-offset-4 hover:underline"
        >
          {tForm("actions.signUp")}
        </Link>
      </p>
    </form>
  );
}
