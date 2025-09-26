"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export default function Modal({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);

  const esc = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  React.useEffect(() => {
    setMounted(true);
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [esc]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
