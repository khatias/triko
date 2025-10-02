"use client";
import React from "react";

type SpinnerProps = {
  className?: string;
  announce?: boolean;
  label?: string;
};

export default function Spinner({
  className = "h-8 w-8",
  announce = true,
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      className="inline-flex items-center"
      role={announce ? "status" : undefined}
      aria-label={announce ? label : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-busy={announce ? true : undefined}
      aria-hidden={announce ? undefined : true}
    >
      <svg
        viewBox="0 0 24 24"
        className={`animate-spin text-orange-500 ${className}`}
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeWidth={4}
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
