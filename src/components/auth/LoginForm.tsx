"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleGoogleLogin } from "@/utils/auth/handleGoogleLogin";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { InputField, PasswordField } from "../form/Field";
import { UserIcon, LockIcon, GoogleMark } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { handleLoginSubmit } from "@/utils/auth/handleAuthSubmit";
import { LegalNotice } from "./LegalNotice";

export default function LoginForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();

  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type LoginInput = z.infer<typeof schemas.loginSchema>;

  const {
    register,
    reset,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(schemas.loginSchema),
    mode: "onChange",
    criteriaMode: "all",
  });

  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (pending) return;

      setErrorMessage(null);
      setNoticeMessage(null);
      setPending(true);

      try {
        const result = await handleLoginSubmit(e, locale);

        if (!result.ok) {
          setErrorMessage(result.message ?? tForm("errors.unknown"));
          reset({ email: "", password: "", website: "" });
          return;
        }

        setNoticeMessage(result.message ?? tForm("notices.signedIn"));
        reset({ email: "", password: "", website: "" });
      } finally {
        setPending(false);
      }
    },
    [locale, pending, reset, tForm]
  );

  return (
    <form
      noValidate
      aria-busy={pending}
      onSubmit={onSubmit}
      className="space-y-0"
    >
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
          disabled={pending}
          className="group flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300/80 bg-white/70 px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm disabled:opacity-60"
          onClick={handleGoogleLogin}
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
          inputMode="email"
          label={tForm("fields.email")}
          icon={UserIcon}
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
                // {...register("remember")} // enable when you persist sessions
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
        aria-hidden="true"
        className="hidden"
        {...register("website")}
      />

      {/* Primary action */}
      <div className="mt-2">
        <SubmitButton loading={pending} disabled={!isValid || pending}>
          {pending ? tForm("actions.sending") : tForm("actions.signIn")}
        </SubmitButton>

<LegalNotice />
      </div>



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
