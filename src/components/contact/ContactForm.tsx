"use client";
import { FC } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { sendEmail } from "../../utils/contact/sendEmail";
import FormCard from "@/components/form/FormCard";
import { InputField, TextAreaField } from "@/components/form/Field";
import SubmitButton from "@/components/form/SubmitButton";
import { MailIcon, MessageIcon, UserIcon } from "@/components/form/icons";

import { Phone } from "lucide-react";

export type FormData = {
  name: string;
  email: string;
  message: string;
  hp?: string;
  ts?: string;
};

const ContactForm: FC = () => {
  const tForm = useTranslations("Form");
  const tErrors = useTranslations("Errors");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await sendEmail(data);
      toast.success(res?.message ?? "Message sent!");
      reset();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
      {/* soft background flair */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 blur-2xl opacity-60"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 10%, rgba(244,63,94,.12), transparent 60%), radial-gradient(40% 30% at 80% 20%, rgba(99,102,241,.10), transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(16,185,129,.10), transparent 60%)",
        }}
      />

      <FormCard
        title={tForm("contactTitle")}
        subtitle={tForm("contactSubtitle")}
      >
        {/* --- Prefer to call (better placement: right under title/subtitle) --- */}
        <div className="mt-2 mb-4 rounded-xl border border-zinc-200/70 bg-white/60 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tForm("preferToCall") || "Prefer to talk to someone directly?"}
            </p>

            <a
              href="tel:+12345678900"
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900/60 transition"
            >
              <Phone className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              +995 593 49 11 44
            </a>
          </div>
        </div>
        {/* --- end prefer to call --- */}

        {/* Honeypot */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
          {...register("hp")}
        />
        <input
          type="hidden"
          value={Date.now().toString()}
          {...register("ts")}
        />

        <InputField
          id="name"
          type="text"
          autoComplete="name"
          label={tForm("fields.fullName")}
          helper={tForm("fields.fullNamePlaceholder")}
          icon={UserIcon}
          disabled={isSubmitting}
          {...register("name", {
            required: tErrors("required"),
            minLength: {
              value: 2,
              message: tErrors("tooShortName", { min: 2 }),
            },
            maxLength: {
              value: 100,
              message: tErrors("tooLongName", { max: 100 }),
            },
          })}
          error={errors.name?.message}
        />

        <InputField
          id="email"
          type="email"
          autoComplete="email"
          label={tForm("fields.email")}
          helper="example@domain.com"
          icon={MailIcon}
          disabled={isSubmitting}
          {...register("email", {
            required: tErrors("required"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
              message: tErrors("invalidEmail"),
            },
            maxLength: {
              value: 254,
              message: tErrors("tooLongEmail", { max: 254 }),
            },
          })}
          error={errors.email?.message}
        />

        <TextAreaField
          id="message"
          rows={5}
          label={tForm("fields.message")}
          helper={tForm("fields.messagePlaceholder")}
          icon={MessageIcon}
          disabled={isSubmitting}
          {...register("message", {
            required: tErrors("required"),
            minLength: {
              value: 10,
              message: tErrors("tooShortMessage", { min: 10 }),
            },
            maxLength: {
              value: 2000,
              message: tErrors("tooLongMessage", { max: 2000 }),
            },
          })}
          error={errors.message?.message}
        />

        <div className="relative">
          <SubmitButton loading={isSubmitting} disabled={!isValid}>
            {isSubmitting ? tForm("actions.sending") : tForm("actions.send")}
          </SubmitButton>

          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            {/* trust hint icon */}
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
            {tForm("trustHint") || "Your data is secure"}
          </p>
        </div>
      </FormCard>
    </form>
  );
};

export default ContactForm;
