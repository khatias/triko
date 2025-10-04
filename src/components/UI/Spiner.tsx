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
    <div
      role={announce ? "status" : undefined}
      aria-label={announce ? label : undefined}
      className="fixed top-0 left-0 w-full h-full bg-gray-800/50 flex items-center justify-center z-50"
    >
      <div className={`lds-ring ${className}`}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      {announce && (
        <span className="sr-only">{label}</span>
      )}
    </div>
  );
}
