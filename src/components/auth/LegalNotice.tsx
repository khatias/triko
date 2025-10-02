// components/auth/LegalNotice.tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function LegalNotice() {
  const tForm = useTranslations("Form");

  return (
    <div className="mt-3 space-y-3 text-xs text-zinc-500 text-center">
      {/* Trust Email & Privacy Notice */}
      <p className="flex items-center justify-center gap-2">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className="fill-none stroke-current"
          aria-hidden="true"
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
        {tForm("notices.trustEmailPrivacy")}
      </p>

      {/* Legal Links */}
      <p className="text-center leading-relaxed">
        {tForm.rich("legal.notice", {
          terms: (chunk) => (
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-rose-600"
            >
              {chunk}
            </Link>
          ),
          privacy: (chunk) => (
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-rose-600"
            >
              {chunk}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
