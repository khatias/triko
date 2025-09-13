import { z, zEmail, requiredString } from "../validation/z";

export const makeAuthSchemas = (t: (k: string) => string) => {
  const emailSchema = requiredString(t("emailRequired"))
    .max(254, { message: t("emailTooLong") })
    .pipe(zEmail({ message: t("invalidEmail") }))
    .transform((v) => v.toLowerCase());

  const passwordSchema = requiredString(t("passwordRequired"))
    .min(8, { message: t("passwordTooShort") })
    .max(72, { message: t("passwordTooLong") })
    .regex(/[A-Z]/, { message: t("passwordUpper") })
    .regex(/[a-z]/, { message: t("passwordLower") })
    .regex(/\d/, { message: t("passwordNumber") })
    .regex(/[^A-Za-z0-9]/, { message: t("passwordSymbol") });

  // Input: string | undefined (optional), Output: string (always)
  const honeypot = z
    .string()
    .default("") // makes input optional; output is string
    .transform((v) => v.trim())
    .superRefine((v, ctx) => {
      if (v.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("botDetected"),
        });
      }
    });

  const loginSchema = z.object({
    email: emailSchema,
    password: requiredString(t("passwordRequired")),
    website: z.string().max(0).optional(),
  });
  const signupSchema = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: requiredString(t("confirmPasswordRequired")),
      website: honeypot,
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: t("passwordsDontMatch"),
        });
      }
    });
  const resetPasswordSchema = z
    .object({
      password: passwordSchema,
      confirmPassword: requiredString(t("confirmPasswordRequired")),
      website: honeypot,
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: t("passwordsDontMatch"),
        });
      }
    });
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
