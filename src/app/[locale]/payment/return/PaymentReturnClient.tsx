"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Check, X, Copy } from "lucide-react";

// --- Types ---
type OrderStatus = "pending_payment" | "paid" | "failed" | "cancelled";
type ViewState = "checking" | "success" | "error";

type StatusResponse = {
  status?: OrderStatus;
};

// --- Small icon wrappers ---
function StatusIcon({
  variant,
}: {
  variant: "checking" | "success" | "error";
}) {
  if (variant === "checking") {
    return <Loader2 className="h-14 w-14 animate-spin text-neutral-900" />;
  }

  if (variant === "success") {
    return (
      <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 shadow-sm animate-[scaleIn_0.4s_ease-out]">
        <Check className="h-10 w-10" strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 shadow-sm animate-[scaleIn_0.4s_ease-out]">
      <X className="h-10 w-10" strokeWidth={2.5} />
    </div>
  );
}

export default function PaymentReturnClient({
  locale,
  orderId,
  token,
}: {
  locale: string;
  orderId: string;
  token?: string | null;
}) {
  const t = useTranslations("PaymentReturn");
  const sp = useSearchParams();

  const statusQ = sp.get("status"); // success | fail
  const statusToken = (token ?? sp.get("token") ?? "").trim();

  const [viewState, setViewState] = useState<ViewState>("checking");
  const [copied, setCopied] = useState(false);

  const statusUrl = useMemo(() => {
    return statusToken
      ? `/api/orders/public-status?token=${encodeURIComponent(statusToken)}`
      : `/api/orders/public-status?orderId=${encodeURIComponent(orderId)}`;
  }, [orderId, statusToken]);

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      for (let i = 0; i < 15; i++) {
        if (!active) return;

        try {
          const res = await fetch(statusUrl, { cache: "no-store" });

          if (res.ok) {
            const data = (await res.json()) as StatusResponse;
            const status = data?.status;

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

    setViewState("checking");
    void checkStatus();

    return () => {
      active = false;
    };
  }, [statusUrl, statusQ]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(orderId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const content: Record<
    ViewState,
    {
      icon: ReactNode;
      title: string;
      desc: string;
      primaryAction: null | { label: string; href: string };
      theme: string;
    }
  > = {
    checking: {
      icon: <StatusIcon variant="checking" />,
      title: t("checking.title"),
      desc: t("checking.desc"),
      primaryAction: null,
      theme: "border-neutral-100",
    },
    success: {
      icon: <StatusIcon variant="success" />,
      title: t("success.title"),
      desc: t("success.desc"),
      primaryAction: {
        label: t("viewMyOrder"),
        href: `/${locale}/profile/orders`,
      },
      theme: "border-emerald-100",
    },
    error: {
      icon: <StatusIcon variant="error" />,
      title: t("error.title"),
      desc: t("error.desc"),
      primaryAction: {
        label: t("tryAgain"),
        href: `/${locale}/cart`,
      },
      theme: "border-rose-100",
    },
  };

  const current = content[viewState];

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#F8F9FA] p-6 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-200 h-150 bg-linear-to-b from-blue-50 to-transparent blur-3xl opacity-50" />
      </div>

      <div
        className={[
          "relative w-full max-w-110 rounded-4xl",
          "bg-white/80 backdrop-blur-xl border",
          "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]",
          "p-8 sm:p-10 transition-all duration-500",
          current.theme,
        ].join(" ")}
      >
        {/* Brand Header */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400">
            {t("brand")}
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
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {t("orderRefLabel")}
            </span>
            <span className="font-mono text-sm font-medium text-neutral-900 truncate max-w-50">
              {orderId}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-white border border-neutral-100 text-neutral-500 shadow-sm hover:text-neutral-900 hover:border-neutral-300 transition-all active:scale-95"
            title={t("copyOrderId")}
            aria-label={t("copyOrderId")}
            type="button"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
            ) : (
              <Copy
                className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 transition-all"
                strokeWidth={2}
              />
            )}
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
            <div className="h-14" aria-hidden="true" />
          )}

          <Link
            href={`/${locale}/`}
            className="block w-full text-center text-sm font-semibold text-neutral-500 hover:text-neutral-900 py-3 transition-colors"
          >
            {t("returnToStore")}
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          0% {
            transform: translateY(5px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
