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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
      {/* background flair */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 blur-2xl opacity-60 dark:opacity-40"
        style={{
          background:
            "radial-gradient(60% 40% at 20% 10%, rgba(244,63,94,.12), transparent 60%), radial-gradient(40% 30% at 80% 20%, rgba(99,102,241,.10), transparent 60%), radial-gradient(60% 40% at 50% 100%, rgba(16,185,129,.10), transparent 60%)",
        }}
      />

      {/* glossy card with gradient border */}
      <div className="mx-auto w-full max-w-xl p-[1px] rounded-2xl">
        <div
          className="rounded-2xl bg-white/80 dark:bg-zinc-900/70 
  backdrop-blur-xl shadow-md ring-1 ring-zinc-200/70 dark:ring-zinc-700/60
  transition transform hover:shadow-xl hover:scale-[1.01]"
        >
          {/* header */}
          <div className="px-6 pt-6 pb-8 border-b border-zinc-200/60 dark:border-zinc-700/50">
            <h3 className="text-3xl pb-4 font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {tForm("contactTitle")}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {tForm("contactSubtitle")}
            </p>
          </div>

          {/* optional accent line */}
          <div className="h-1 w-12 mt-2 bg-gradient-to-r from-[#fdd5a2] to-[#fc5c5c] rounded-full"></div>

          <div className="px-6 pb-6 pt-2">
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
            <div className="mb-5">
              <div className={`group relative`}>
                <div
                  className={`pointer-events-none absolute inset-y-0 left-3 flex items-center`}
                >
                  {/* user icon svg (no extra deps) */}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="opacity-70 fill-none stroke-current text-zinc-500 dark:text-zinc-400"
                  >
                    <path
                      d="M20 21a8 8 0 0 0-16 0"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="7" r="4" strokeWidth="1.5" />
                  </svg>
                </div>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder=" " /* floating label pattern */
                  aria-invalid={!!errors.name || undefined}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  disabled={isSubmitting}
                  className={[
                    "peer w-full rounded-xl border bg-white/60",
                    "px-10 py-3.5 text-base font-medium",
                    "text-zinc-800 placeholder-zinc-400",
                    "placeholder-transparent outline-none transition",
                    "border-zinc-300/80",
                    errors.name
                      ? "border-[#fc5c5c] focus:border-[#fc5c5c] focus:ring-[#fc5c5c]/30 text-[#fc5c5c]"
                      : "focus:border-[#fdd5a2] focus:ring-4 focus:ring-[#fdd5a2]/40 hover:border-[#fdd5a2]/70 focus:text-zinc-900",
                  ].join(" ")}
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
                />

                <label
                  htmlFor="name"
                  className={[
                    "pointer-events-none absolute left-10 top-1/2 -translate-y-1/2",
                    "px-1 text-[13px] text-zinc-500 ",
                    "transition-all duration-200",
                    "bg-white/80 dark:bg-zinc-900/70",
                    "peer-focus:-top-3 peer-focus:translate-y-0 ",
                    "peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0",
                    "rounded",
                  ].join(" ")}
                >
                  {tForm("fields.fullName")}
                </label>
              </div>

              {/* helper/error */}
              <div className="mt-1 min-h-5">
                {errors.name ? (
                  <p
                    id="name-error"
                    className="text-sm text-rose-600 dark:text-rose-400"
                    aria-live="polite"
                  >
                    {errors.name.message}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 ">
                    {tForm("fields.fullNamePlaceholder")}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="opacity-70 fill-none stroke-current text-zinc-500 dark:text-zinc-400"
                  >
                    <path d="M4 7l8 5 8-5" strokeWidth="1.5" />
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                      ry="2"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder=" "
                  aria-invalid={!!errors.email || undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isSubmitting}
                  className={[
                    "peer w-full rounded-xl border bg-white/60",
                    "px-10 py-3.5 text-base font-medium",
                    "text-zinc-800 placeholder-zinc-400",
                    "placeholder-transparent outline-none transition",
                    "border-zinc-300/80",
                    errors.email
                      ? "border-[#fc5c5c] focus:border-[#fc5c5c] focus:ring-[#fc5c5c]/30 text-[#fc5c5c]"
                      : "focus:border-[#fdd5a2] focus:ring-4 focus:ring-[#fdd5a2]/40 hover:border-[#fdd5a2]/70 focus:text-zinc-900",
                  ].join(" ")}
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
                />

                <label
                  htmlFor="email"
                  className={[
                    "pointer-events-none absolute left-10 top-1/2 -translate-y-1/2",
                    "px-1 text-[13px] text-zinc-500 dark:text-zinc-400",
                    "transition-all duration-200",
                    "bg-white/80 dark:bg-zinc-900/70",
                    "peer-focus:-top-3 peer-focus:translate-y-0 ",
                    "peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0",
                    "rounded",
                  ].join(" ")}
                >
                  {tForm("fields.email")}
                </label>
              </div>

              <div className="mt-1 min-h-5">
                {errors.email ? (
                  <p
                    id="email-error"
                    className="text-sm text-rose-600 dark:text-rose-400"
                    aria-live="polite"
                  >
                    {errors.email.message}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    example@domain.com
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <div className="group relative">
                <div className="pointer-events-none absolute left-3 top-3.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="opacity-70 fill-none stroke-current text-zinc-500 dark:text-zinc-400"
                  >
                    <path
                      d="M21 15a4 4 0 0 1-4 4H8l-5 3V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7z"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <textarea
                  id="message"
                  rows={5}
                  placeholder=" "
                  aria-invalid={!!errors.message || undefined}
                  aria-describedby={
                    errors.message ? "message-error" : undefined
                  }
                  disabled={isSubmitting}
                  className={[
                    "peer w-full rounded-xl border bg-white/60",
                    "px-10 py-3.5 text-base font-medium",
                    "text-zinc-800 placeholder-zinc-400",
                    "placeholder-transparent outline-none transition",
                    "border-zinc-300/80",

                    errors.message
                      ? "border-[#fc5c5c] focus:border-[#fc5c5c] focus:ring-[#fc5c5c]/30 text-[#fc5c5c]"
                      : "focus:border-[#fdd5a2] focus:ring-4 focus:ring-[#fdd5a2]/40 hover:border-[#fdd5a2]/70 focus:text-zinc-900",
                  ].join(" ")}
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
                />

                <label
                  htmlFor="message"
                  className={[
                    "pointer-events-none absolute left-10 top-3.5",
                    "px-1 text-[13px] text-zinc-500 dark:text-zinc-400",
                    "transition-all duration-200",
                    "bg-white/80 dark:bg-zinc-900/70",
                    "peer-focus:-top-3 peer-focus:translate-y-0 ",
                    "peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:translate-y-0",
                    "rounded",
                  ].join(" ")}
                >
                  {tForm("fields.message")}
                </label>
              </div>

              <div className="mt-1 min-h-5">
                {errors.message ? (
                  <p
                    id="message-error"
                    className="text-sm text-rose-600 dark:text-rose-400"
                    aria-live="polite"
                  >
                    {errors.message.message}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {tForm("fields.messagePlaceholder")}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="relative">
              {/* subtle sheen */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-r from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition"
              />
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className={[
                  "group w-full rounded-xl px-6 py-3.5 font-semibold text-white",
                  "bg-red-400",
                  "hover:bg-red-500 dark:hover:bg-red-600",
                  "transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400",
                  "active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      {/* spinner */}
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      {tForm("actions.sending")}
                    </>
                  ) : (
                    <>{tForm("actions.submit")}</>
                  )}
                </span>
              </button>

              {/* trust hint */}
              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
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
          </div>
        </div>
      </div>
    </form>
  );
};

export default ContactForm;
