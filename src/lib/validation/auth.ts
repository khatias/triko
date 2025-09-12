
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

  const loginSchema = z.object({
    email: emailSchema,
    password: requiredString(t("passwordRequired")),
    website: z.string().max(0).optional(),
  });

  return {
    emailSchema,
    passwordSchema,
    loginSchema,
  };
};


export type AuthSchemas = ReturnType<typeof makeAuthSchemas>;
