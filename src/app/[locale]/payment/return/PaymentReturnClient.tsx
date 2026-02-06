"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// --- Types ---
type OrderStatus = "pending_payment" | "paid" | "failed" | "cancelled";
type ViewState = "checking" | "success" | "error";

// --- Icons (SVG) ---

const SpinnerIcon = () => (
  <svg
    className="animate-spin h-14 w-14 text-neutral-900"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-10"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-100"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const SuccessIcon = () => (
  <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shadow-sm animate-[scaleIn_0.4s_ease-out]">
    <svg
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

const ErrorIcon = () => (
  <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 shadow-sm animate-[scaleIn_0.4s_ease-out]">
    <svg
      className="h-10 w-10"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </div>
);

const CopyIcon = ({ copied }: { copied: boolean }) =>
  copied ? (
    <svg
      className="w-4 h-4 text-emerald-600 transition-all"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-all"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );

// --- Component ---

export default function PaymentReturnClient({
  locale,
  orderId,
  token,
}: {
  locale: string;
  orderId: string;
  token?: string | null;
}) {
  const sp = useSearchParams();
  const statusQ = sp.get("status"); // 'success' | 'fail'

  const statusToken = (token ?? sp.get("token") ?? "").trim();
  const [viewState, setViewState] = useState<ViewState>("checking");
  const [copied, setCopied] = useState(false);

  // Polling Logic
  useEffect(() => {
    let active = true;

    async function checkStatus() {
      const url = statusToken
        ? `/api/orders/public-status?token=${encodeURIComponent(statusToken)}`
        : `/api/orders/public-status?orderId=${encodeURIComponent(orderId)}`;

      for (let i = 0; i < 15; i++) {
        if (!active) return;

        try {
          const res = await fetch(url, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            const status = data?.status as OrderStatus | undefined;

            if (status === "paid") {
              setViewState("success");
              return;
            }
            if (status === "failed" || status === "cancelled") {
              setViewState("error");
              return;
            }
          }
        } catch (err) {
          console.error("Payment check error:", err);
        }
        await new Promise((r) => setTimeout(r, 1500));
      }

      if (active) {
        setViewState(statusQ === "fail" ? "error" : "checking");
      }
    }

    checkStatus();
    return () => {
      active = false;
    };
  }, [orderId, statusToken, statusQ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Content Configuration
  const content = {
    checking: {
      icon: <SpinnerIcon />,
      title: "Verifying Payment",
      desc: "Please wait while we confirm your transaction with the bank.",
      primaryAction: null,
      theme: "border-neutral-100",
    },
    success: {
      icon: <SuccessIcon />,
      title: "Order Confirmed",
      desc: "Thank you for shopping with Triko. Your payment was successful.",
      primaryAction: { label: "View My Order", href: `/${locale}/profile/orders` },
      theme: "border-emerald-100",
    },
    error: {
      icon: <ErrorIcon />,
      title: "Payment Failed",
      desc: "The transaction was declined or cancelled. No funds were taken.",
      primaryAction: { label: "Try Again", href: `/${locale}/cart` },
      theme: "border-rose-100",
    },
  };

  const current = content[viewState];

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FA] p-6 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* Background Decor (Subtle Gradient) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-200 h-150 bg-linear-to-b from-blue-50 to-transparent blur-3xl opacity-50" />
      </div>

      <div
        className={`
          relative w-full max-w-110 rounded-4xl 
          bg-white/80 backdrop-blur-xl border 
          shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] 
          p-8 sm:p-10 transition-all duration-500
          ${current.theme}
        `}
      >
        {/* Brand Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">
            TRIKO
          </span>
        </div>

        {/* Icon Area */}
        <div className="flex justify-center mb-8 min-h-20 items-end">
          {current.icon}
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 animate-[fadeIn_0.5s_ease-out]">
            {current.title}
          </h1>
          <p className="text-neutral-500 text-[15px] leading-relaxed max-w-70 mx-auto animate-[fadeIn_0.5s_ease-out_0.1s_both]">
            {current.desc}
          </p>
        </div>

        {/* Order ID Card */}
        <div className="bg-neutral-50/80 rounded-2xl border border-neutral-200/60 p-4 mb-8 flex items-center justify-between group transition-colors hover:border-neutral-300/60">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Order Reference
            </span>
            <span className="font-mono text-sm font-medium text-neutral-900 truncate max-w-50">
              {orderId}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-white border border-neutral-100 text-neutral-500 shadow-sm hover:text-neutral-900 hover:border-neutral-300 transition-all active:scale-95"
            title="Copy Order ID"
          >
            <CopyIcon copied={copied} />
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {current.primaryAction ? (
            <Link
              href={current.primaryAction.href}
              className="flex w-full items-center justify-center bg-neutral-900 hover:bg-black text-white font-semibold py-4 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-neutral-900/10 animate-[scaleIn_0.3s_ease-out]"
            >
              {current.primaryAction.label}
            </Link>
          ) : (
            // Placeholder to prevent layout jump
             <div className="h-14" aria-hidden />
          )}

          <Link
            href={`/${locale}/`}
            className="block w-full text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 py-3 transition-colors"
          >
            Return to Store
          </Link>
        </div>

        {/* Checking Footer Note */}
        {viewState === "checking" && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-[10px] text-neutral-300 animate-pulse font-medium">
              Secure connection established
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          0% { transform: translateY(5px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </main>
  );
}