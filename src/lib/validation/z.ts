import * as Z from "zod";

export { Z as z };

export type EmailParams =
  | string
  | {
      message?: string;
      abort?: boolean;
      pattern?: RegExp;
    };

const DEFAULT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function zEmail(params?: EmailParams): Z.ZodString {
  const message = typeof params === "string" ? params : params?.message;
  const pattern =
    typeof params === "object" && params?.pattern instanceof RegExp
      ? params.pattern
      : DEFAULT_EMAIL_REGEX;

  return Z.string().regex(pattern, { message: message ?? "Invalid email" });
}

export function requiredString(message: string): Z.ZodString {
  return Z.string().trim().min(1, { message });
}
