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
        className="pointer-events-none absolute -inset-6 -z-10 blur-2xl opacity-60 "
        style={{
          background:
            "radial-gradient(60% 40% at 20% 10%, rgba(244,63,94,.12), transparent 60%), radial-gradient(40% 30% at 80% 20%, rgba(99,102,241,.10), transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(16,185,129,.10), transparent 60%)",
        }}
      />

      <FormCard
        title={tForm("contactTitle")}
        subtitle={tForm("contactSubtitle")}
      >
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
          <SubmitButton loading={isSubmitting} disabled={!isValid} >
            
            {isSubmitting ? tForm("actions.sending") : tForm("actions.send")}
          </SubmitButton>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500 ">
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
          </p>
        </div>
      </FormCard>
    </form>
  );
};

export default ContactForm;
