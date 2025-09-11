"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { InputField, PasswordField } from "../form/Field";
import { UserIcon, LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { GoogleMark } from "../form/icons";

export default function LoginForm() {
  const tForm = useTranslations("Form");

  // UI-only placeholders so SubmitButton renders without wiring up react-hook-form
  const isSubmitting = false;
  const isValid = true;

  return (
    <form noValidate>
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

      <div>
        {/* google authentication */}
        <div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300/80 bg-white/70 px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm "
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
        <div className="grid">
          <InputField
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label={tForm("fields.email")}
            icon={UserIcon}
            required
          />

          <div>
            <PasswordField
              id="password"
              name="password"
              autoComplete="current-password"
              label={tForm("fields.password")}
              icon={LockIcon}
              required
            />

            <div className="flex items-center justify-between">
              <label className="inline-flex select-none items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-rose-600 accent-rose-600 focus:ring-rose-300"
                />
                <span> {tForm("links.rememberMe")}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-rose-600 underline-offset-4 hover:underline"
              >
                <span> {tForm("links.forgotPassword")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Primary action */}
        <div className="mt-2">
          <SubmitButton loading={isSubmitting} disabled={!isValid}>
            {isSubmitting ? tForm("actions.sending") : tForm("actions.submit")}
          </SubmitButton>

          {/* Trust note */}
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="fill-none stroke-current"
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
      </div>
    </form>
  );
}
