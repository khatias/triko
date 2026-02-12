// LoginForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { handleGoogleLogin } from "@/utils/auth/handleGoogleLogin";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { loginRequest } from "../../utils/auth/requests";

import { InputField, PasswordField } from "../form/Field";
import { UserIcon, LockIcon, GoogleMark } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { LegalNotice } from "./LegalNotice";
import { formHeading } from "../UI/primitives";

type LoginApiResp = {
  ok: boolean;
  message?: string;
  redirectTo?: string;
};

export default function LoginForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();

  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type LoginInput = z.infer<typeof schemas.loginSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(schemas.loginSchema),
    mode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      password: "",
      website: "",
    },
  });

  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage(null);
    setPending(true);

    try {
      const result = (await loginRequest(
        locale,
        data.email,
        data.password,
        data.website,
      )) as LoginApiResp;

      if (!result.ok) {
        setErrorMessage(result.message ?? tForm("errors.unknown"));

        // keep email, clear only sensitive fields
        reset(
          { email: data.email, password: "", website: "" },
          { keepErrors: true, keepTouched: true },
        );
        return;
      }

      // success: clear everything
      reset({ email: "", password: "", website: "" });

      const redirectTo = result.redirectTo || `/${locale}/profile`;

      // better UX than push: back button won't go back to login
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage(tForm("errors.unknown"));

      reset(
        { email: data.email, password: "", website: "" },
        { keepErrors: true, keepTouched: true },
      );
    } finally {
      setPending(false);
    }
  });

  return (
    <form noValidate aria-busy={pending} onSubmit={onSubmit}>
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="my-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
        >
          <strong>{errorMessage}</strong>
        </div>
      )}

      <h2 className={formHeading}>
        <span className="inline-block bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
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
          <span className="translate-x-0 transition group-hover:translate-x-px">
            {tForm("actions.google")}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="my-4">
        <div className="flex justify-center">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-500 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
            {tForm("ui.or")}
          </span>
        </div>
      </div>

      {/* Email + Password */}
      <div className="grid">
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

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-rose-600 underline-offset-4 hover:underline"
            >
              {tForm("links.forgotPassword")}
            </Link>
          </div>
        </div>
      </div>

      {/* Honeypot */}
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

      {/* Sign up CTA */}
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
