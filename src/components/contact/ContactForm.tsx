"use client";

import { FC } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { sendEmail } from "../../utils/contact/sendEmail";

export type FormData = {
  name: string;
  email: string;
  message: string;
  // Honeypot (bot trap) — not shown to real users
  hp?: string;
};

const ContactForm: FC = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ mode: "onSubmit" });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await sendEmail(data);
      toast.success(res?.message ?? "Message sent!");
      reset();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mx-auto max-w-full min-w-80 px-8 py-6 bg-white lg:min-w-[500px] dark:bg-gray-800 rounded-lg"
    >
      {/* Honeypot field (hidden) */}
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
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Full name"
          aria-invalid={!!errors.name || undefined}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`mt-1 w-full rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("name", {
            required: "required",
            minLength: { value: 2, message: "too short" },
            maxLength: { value: 100, message: "too long" },
          })}
        />
        {errors.name && (
          <p id="name-error" className="text-red-500 text-sm mt-1">
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
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="example@domain.com"
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`mt-1 w-full rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.email ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("email", {
            required: "required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
              message: "invalid email",
            },
            maxLength: { value: 254, message: "too long" },
          })}
        />
        {errors.email && (
          <p id="email-error" className="text-red-500 text-sm mt-1">
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
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          placeholder="Your message"
          aria-invalid={!!errors.message || undefined}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={`mt-1 w-full resize-none rounded-md border py-3 px-4 text-base font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-red-500 ${
            errors.message ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
          disabled={isSubmitting}
          {...register("message", {
            required: "required",
            minLength: { value: 10, message: "too short" },
            maxLength: { value: 2000, message: "too long" },
          })}
        />
        {errors.message && (
          <p id="message-error" className="text-red-500 text-sm mt-1">
            {errors.message.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-red-500 py-3 px-6 text-base font-semibold text-white outline-none transition duration-300 ease-in-out hover:bg-red-600 dark:hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
