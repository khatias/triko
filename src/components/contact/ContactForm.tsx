"use client";

import { FC } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { sendEmail } from "../../utils/contact/sendEmail";
import { useTranslations } from "use-intl";
export type FormData = {
  name: string;
  email: string;
  message: string;
  hp?: string;
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
    mode: "onChange", // ✅ validate while typing
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mx-auto max-w-full min-w-80 px-8 py-6 bg-white lg:min-w-[500px] dark:bg-gray-800 rounded-lg"
    >
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("hp")}
      />

      {/* Name */}
      <div className="mb-6">
        <label
          htmlFor="name"
          className="block text-base font-medium text-gray-900 dark:text-gray-200"
        >
          {tForm("fields.fullName")}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={tForm("fields.fullNamePlaceholder")}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`mt-1 w-full rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.name
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("name", {
            required: tErrors("required"),
            minLength: {
              value: 2,
              message: tErrors("tooShortName", { min: 2 }),
            },
            maxLength: {
              value: 100,
              message: tErrors("tooLongName", { min: 2 }),
            },
          })}
        />
        {errors.name && (
          <p
            id="name-error"
            className="text-red-500 text-sm mt-1"
            aria-live="polite"
          >
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block text-base font-medium text-gray-900 dark:text-gray-200"
        >
          {tForm("fields.email")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="example@domain.com"
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`mt-1 w-full rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.email
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("email", {
            required: tErrors("required"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
              message: tErrors("invalidEmail"),
            },
            maxLength: { value: 254, message: tErrors("tooLongEmail") },
          })}
        />
        {errors.email && (
          <p
            id="email-error"
            className="text-red-500 text-sm mt-1"
            aria-live="polite"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="mb-6">
        <label
          htmlFor="message"
          className="block text-base font-medium text-gray-900 dark:text-gray-200"
        >
          {tForm("fields.message")}
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder={tForm("fields.messagePlaceholder")}
          aria-invalid={!!errors.message || undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`mt-1 w-full resize-none rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.message
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("message", {
            required: tErrors("required"),
            minLength: { value: 10, message: tErrors("tooShortMessage") },
            maxLength: { value: 2000, message: tErrors("tooLongMessage") },
          })}
        />
        {errors.message && (
          <p
            id="message-error"
            className="text-red-500 text-sm mt-1"
            aria-live="polite"
          >
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !isValid} // optional: disable when invalid
          className="w-full rounded-md bg-red-500 py-3 px-6 text-base font-semibold text-white outline-none transition duration-300 ease-in-out hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? tForm("actions.sending") : tForm("actions.submit")}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
