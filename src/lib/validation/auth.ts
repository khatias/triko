// src/lib/validation/auth.ts
import { z, zEmail, requiredString } from "../validation/z";

export const makeAuthSchemas = (t: (k: string) => string) => {
  /**
   * Email validation schema
   * - Required string
   * - Max length 254
   * - Must be valid email format
   * - Normalized to lowercase
   */
  const emailSchema = requiredString(t("emailRequired"))
    .max(254, { message: t("emailTooLong") })
    .pipe(zEmail({ message: t("invalidEmail") }))
    .transform((v) => v.toLowerCase());

  /**
   * Password validation schema (SIGNUP/RESET)
   * - 8–72 characters
   * - Upper + lower + number + symbol
   */
  const passwordSchema = requiredString(t("passwordRequired"))
    .min(8, { message: t("passwordTooShort") })
    .max(72, { message: t("passwordTooLong") })
    .regex(/[A-Z]/, { message: t("passwordUpper") })
    .regex(/[a-z]/, { message: t("passwordLower") })
    .regex(/\d/, { message: t("passwordNumber") })
    .regex(/[^A-Za-z0-9]/, { message: t("passwordSymbol") });

  /**
   * Honeypot anti-bot field
   * - Always string (prevents resolver type mismatch)
   * - If filled -> validation fails
   */
  const honeypot = z
    .string()
    .transform((v) => v.trim())
    .superRefine((v, ctx) => {
      if (v.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: t("botDetected"),
        });
      }
    });

  /**
   * Login schema
   * - IMPORTANT: login should NOT enforce strong password rules
   * - Only required string + max length (handled in route too)
   */
  const loginSchema = z.object({
    email: emailSchema,
    password: requiredString(t("passwordRequired")).max(72, {
      message: t("passwordTooLong"),
    }),
    website: honeypot,
  });

  /**
   * Signup schema
   */
  const signupSchema = z
    .object({
      email: emailSchema,
      full_name: requiredString(t("required"))
        .min(3, { message: t("tooShortName") })
        .max(100, { message: t("tooLongName") }),
      password: passwordSchema,
      confirmPassword: requiredString(t("confirmPasswordRequired")),
      website: honeypot,
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("passwordsDontMatch"),
        });
      }
    });

  /**
   * Reset password schema
   */
  const resetPasswordSchema = z
    .object({
      password: passwordSchema,
      confirmPassword: requiredString(t("confirmPasswordRequired")),
      website: honeypot,
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("passwordsDontMatch"),
        });
      }
    });

  /**
   * Forgot password schema
   */
  const forgotPasswordSchema = z.object({
    email: emailSchema,
    website: honeypot,
  });

  return {
    emailSchema,
    passwordSchema,
    honeypot,
    loginSchema,
    signupSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
  };
};

export type AuthSchemas = ReturnType<typeof makeAuthSchemas>;

/**
 * Helpers used by API routes
 */
export const sanitizeEmail = (v: unknown) =>
  String(v ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

export const isValidEmail = (v: string) =>
  !!v && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/**
 * NOTE: This is only length validation.
 * Strong password rules are handled by Zod schema (signup/reset),
 * and should not be enforced on login.
 */
export const isValidPassword = (v: string) =>
  typeof v === "string" && v.length >= 8 && v.length <= 72;
