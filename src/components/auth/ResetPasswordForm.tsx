"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { makeAuthSchemas } from "@/lib/validation/auth";
import { PasswordField } from "../form/Field";
import { LockIcon } from "../form/icons";
import SubmitButton from "../form/SubmitButton";
import { handleResetPassword } from "@/utils/auth/handleResetPassword";
import { formHeading } from "../UI/primitives";
import { useRouter } from "next/navigation";

export default function ResetPasswordForm() {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");
  const locale = useLocale();
  const router = useRouter();
  const schemas = makeAuthSchemas((k) => tErrors?.(k) ?? k);
  type ResetPasswordInput = z.input<typeof schemas.resetPasswordSchema>;

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(schemas.resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "", website: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });
  const passwordReg = register("password");
  const confirmPasswordReg = register("confirmPassword");
  const [uiMessage, setUiMessage] = useState<{
    text: string;
    tone: "ok" | "err";
  } | null>(null);

  const safeT = (translator: ReturnType<typeof useTranslations>) => {
    return (key: string, fallback?: string) => {
      const out = translator?.(key);
      if (!out || out === key) return fallback ?? key;
      return out;
    };
  };

  const tFormSafe = safeT(tForm);
  const tErrorsSafe = safeT(tErrors);

  const showResultMessage = (code?: string, raw?: string) => {
    if (code === "PASSWORD_UPDATED") {
      setUiMessage({
        tone: "ok",
        text: tFormSafe(
          "messages.passwordUpdated",
          "Your password has been updated."
        ),
      });
      return;
    }

    const keyByCode: Record<string, string> = {
      reset_link_invalid_or_expired: "reset_link_invalid_or_expired",
      weak_password: "weak_password",
      rate_limited: "rate_limited",
      server_error: "server_error",
      network: "network",
      unknown: "unknown",
    };

    const k = code ? keyByCode[code] : undefined;
    const text =
      (k && tErrorsSafe(k)) ||
      raw ||
      tFormSafe(
        "messages.genericError",
        "Something went wrong. Please try again."
      );

    setUiMessage({ tone: "err", text });
  };

  const onSubmit: SubmitHandler<ResetPasswordInput> = async (data) => {
    setUiMessage(null);
    const res = await handleResetPassword(data.password);

    if (res.ok) {
      showResultMessage(res.code, res.message);
      router.refresh();
      router.replace(`/${locale}/profile`);

      return;
    }

    showResultMessage(res.code, res.message);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="reset-title"
      noValidate
    >
      <h2 id="reset-title" className={formHeading}>
        <span className="inline-block bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-700 bg-clip-text text-transparent">
          {tFormSafe("resetPasswordTitle", "Reset password")}
        </span>
      </h2>

      <p className="text-center text-sm text-zinc-600 sm:text-base">
        {tFormSafe(
          "resetPasswordSubtitle",
          "Enter a new password for your account."
        )}
      </p>

      <div className="mt-4 grid">
        <PasswordField
          id="password"
          autoComplete="new-password"
          label={tFormSafe("fields.password", "New password")}
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
          label={tFormSafe("fields.confirmPassword", "Confirm password")}
          icon={LockIcon}
          maxLength={72}
          {...confirmPasswordReg}
          error={errors.confirmPassword?.message}
          required
        />

        {/* Honeypot hidden field */}
        <input type="hidden" {...register("website")} />

        <div className="text-xs leading-relaxed text-zinc-500">
          {tFormSafe(
            "notices.passwordHint",
            "Use at least 8 characters, mixing letters, numbers and symbols."
          )}
        </div>

        <div className="mt-1 text-center">
          <SubmitButton loading={isSubmitting} disabled={!isValid}>
            {isSubmitting
              ? tFormSafe("actions.sending", "Updating…")
              : tFormSafe("actions.updatePassword", "Update password")}
          </SubmitButton>
        </div>

        {uiMessage && (
          <p
            role="status"
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
            {tFormSafe("links.backToLogin", "Back to sign in")}
          </Link>
        </p>
      </div>
    </form>
  );
}
