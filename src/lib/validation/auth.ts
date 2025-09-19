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
   * Password validation schema
   * - Required string
   * - 8–72 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one symbol
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
   * - Optional hidden field
   * - Trimmed string
   * - If user/bot fills this in, validation fails (bot detected)
   */
  const honeypot = z
    .string()
    .default("") // makes input optional; ensures string output
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
   * - Email (validated with emailSchema)
   * - Password (required, no complex rules here)
   * - Website (hidden honeypot field, must be empty if present)
   */
  const loginSchema = z.object({
    email: emailSchema,
    password: requiredString(t("passwordRequired")),
    website: z.string().max(0).optional(),
  });

  /**
   * Signup schema
   * - Email (validated with emailSchema)
   * - Password (validated with passwordSchema)
   * - ConfirmPassword (must match password)
   * - Honeypot field
   */
  const signupSchema = z
    .object({
      email: emailSchema,
      full_name: requiredString(t("required")).min(3, { message: t("tooShortName") }).max(100 , { message: t("tooLongName") }),
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
   * - Same rules as signup (password + confirmPassword must match)
   * - Honeypot field included
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
   * - Email (validated with emailSchema)
   * - Honeypot field
   */
  const forgotPasswordSchema = z.object({
    email: emailSchema,
    website: honeypot,
  });

  return {
    emailSchema,
    passwordSchema,
    loginSchema,
    signupSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
  };
};

export type AuthSchemas = ReturnType<typeof makeAuthSchemas>;

export const sanitizeEmail = (v: unknown) =>
  String(v ?? "").normalize("NFKC").trim().toLowerCase();

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;

export const isValidEmail = (v: string) =>
  !!v && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidPassword = (v: string) =>
  typeof v === "string" && v.length >= 8 && v.length <= 72;