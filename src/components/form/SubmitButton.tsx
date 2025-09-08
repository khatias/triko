import { ButtonHTMLAttributes } from "react";

export default function SubmitButton({
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={props.disabled || loading}
      className="group w-full rounded-xl px-6 py-3.5 font-semibold text-white bg-red-400 hover:bg-red-500 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-400 active:scale-[.99] disabled:opacity-60 disabled:cursor-not-allowed"
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {loading ? (
          <>
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
            {children}
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
}
