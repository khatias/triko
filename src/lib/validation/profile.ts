import { z, requiredString } from "../validation/z";

const normalizeWhitespace = (v: string) => v.replace(/\s+/g, " ").trim();
const hasLetterOrNumber = (v: string) => /[\p{L}\p{N}]/u.test(v); // Georgian ok

function normalizeGePhoneToNational9(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("995") && digits.length === 12) return digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits.slice(1);
  if (digits.length === 9) return digits;

  return null;
}
export const fullNameSchema = (t: (k: string) => string) =>
  requiredString(t("fullNameRequired"))
    .trim()
    .min(1, { message: t("fullNameRequired") })
    .transform(normalizeWhitespace)
    .refine((v) => v.split(" ").filter(Boolean).length >= 2, {
      message: t("fullNamePleaseFirstLast"),
    })
    .refine((v) => /[\p{L}]/u.test(v), {
      message: t("fullNamePleaseFirstLast"),
    });

export function makeGeorgiaPhoneSchema(params: {
  t: (k: string) => string;
  output?: "national" | "e164";
  allowLandline?: boolean;
}) {
  const { t, output = "national", allowLandline = true } = params;

  return z
    .string()
    .trim()
    .min(1, { message: t("phoneRequired") })
    .transform((raw, ctx) => {
      const s = raw.trim();

      // ✅ hard block letters and other junk
      // allowed: digits, spaces, +, (, ), -
      if (!/^[0-9+\s()-]*$/.test(s)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneInvalidCharacters"),
        });
        return z.NEVER;
      }

      const national9 = normalizeGePhoneToNational9(s);
      if (!national9) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneMustHave9Digits"),
        });
        return z.NEVER;
      }

      if (/^(\d)\1{8}$/.test(national9)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneLooksInvalid"),
        });
        return z.NEVER;
      }

      if (!allowLandline && !national9.startsWith("5")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("phoneMustBeMobile"),
        });
        return z.NEVER;
      }

      return output === "e164" ? `+995${national9}` : national9;
    });
}
/* ---------- Address validation ---------- */

const normalizeAddr = (v: string) =>
  normalizeWhitespace(v.replace(/\n+/g, " "));

export const citySchema = (t: (k: string) => string) =>
  requiredString(t("cityRequired"))
    .trim()
    .min(2, { message: t("cityTooShort") })
    .max(60, { message: t("cityTooLong") })
    .refine((v) => /[\p{L}]/u.test(v), { message: t("cityMustContainLetters") })
    .transform(normalizeWhitespace); // collapse inner spaces after validation

const addressLineSchema = (t: (k: string) => string) =>
  requiredString(t("addressLineRequired"))
    .trim()
    .min(5, { message: t("addressLineTooShort") })
    .max(220, { message: t("addressLineTooLong") })
    .transform(normalizeAddr)
    .refine(hasLetterOrNumber, {
      message: t("addressLineMustContainLettersOrNumbers"),
    });

const addressLineOptionalSchema = (t: (k: string) => string) =>
  z
    .string()
    .trim()
    .max(220, { message: t("addressLineTooLong") })
    .transform(normalizeAddr)
    .refine((v) => v.length === 0 || hasLetterOrNumber(v), {
      message: t("addressLineMustContainLettersOrNumbers"),
    })
    .optional()
    .default("");

const regionSchema = (t: (k: string) => string) =>
  z
    .string()
    .trim()
    .max(80, { message: t("regionTooLong") })
    .transform(normalizeWhitespace)
    .refine((v) => v.length === 0 || hasLetterOrNumber(v), {
      message: t("regionMustContainLettersOrNumbers"),
    })
    .optional()
    .default("");

// ✅ factory (important)
export const addressSchema = (t: (k: string) => string) =>
  z
    .object({
      line1: addressLineSchema(t),
      line2: addressLineOptionalSchema(t),
      city: citySchema(t),
      region: regionSchema(t),
    })
    .strict();
