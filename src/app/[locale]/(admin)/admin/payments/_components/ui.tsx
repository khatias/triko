import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Delete, Loader2 } from "lucide-react";

import { CURRENCY } from "../config";
import type { KeypadKey, Tone } from "../types";
import { formatAmount } from "../utils";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// =====================================================================
// Tones
// =====================================================================

const TONE: Record<
  Tone,
  { badge: string; pill: string; dot: string; notice: string; halo: string }
> = {
  neutral: {
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    pill: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-800",
    dot: "bg-zinc-400",
    notice: "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300",
    halo: "bg-zinc-300",
  },
  info: {
    badge: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    pill: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900",
    dot: "bg-sky-500",
    notice: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
    halo: "bg-sky-400",
  },
  success: {
    badge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
    dot: "bg-emerald-500",
    notice: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    halo: "bg-emerald-400",
  },
  warning: {
    badge: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    pill: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
    dot: "bg-amber-500",
    notice: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    halo: "bg-amber-400",
  },
  danger: {
    badge: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
    pill: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
    dot: "bg-red-500",
    notice: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
    halo: "bg-red-400",
  },
};

// One orchestrated moment: the result badge settles in. Reduced motion
// users get the final state immediately.
const MOTION_CSS = `
@keyframes terminal-pop { 0% { transform: scale(.6); opacity: 0 } 60% { transform: scale(1.06); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes terminal-halo { 0% { transform: scale(1); opacity: .45 } 100% { transform: scale(1.7); opacity: 0 } }
.terminal-pop { animation: terminal-pop 420ms cubic-bezier(.2,.9,.3,1.25) both }
.terminal-halo { animation: terminal-halo 900ms ease-out 180ms both }
@media (prefers-reduced-motion: reduce) {
  .terminal-pop { animation: none }
  .terminal-halo { animation: none; opacity: 0 }
}
`;

// =====================================================================
// Layout
// =====================================================================

export function Shell({
  title,
  meta,
  status,
  children,
}: {
  title: string;
  meta?: ReactNode;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(24,24,27,0.04),0_12px_32px_-16px_rgba(24,24,27,0.18)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
      <style>{MOTION_CSS}</style>

      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 sm:px-7 dark:border-zinc-900">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {meta && <p className="truncate text-xs text-zinc-500">{meta}</p>}
        </div>
        {status && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{status}</div>
        )}
      </header>

      <div className="px-5 py-7 sm:px-8 sm:py-9">{children}</div>
    </section>
  );
}

// =====================================================================
// Status and messages
// =====================================================================

export function StatusPill({
  label,
  tone,
  pulse = false,
}: {
  label: string;
  tone: Tone;
  pulse?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TONE[tone].pill,
      )}
    >
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        {pulse && (
          <span
            className={cx(
              "absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping",
              TONE[tone].dot,
            )}
          />
        )}
        <span className={cx("relative inline-flex h-1.5 w-1.5 rounded-full", TONE[tone].dot)} />
      </span>
      {label}
    </span>
  );
}

export function StateHero({
  tone,
  icon,
  title,
  children,
  celebrate = false,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  celebrate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        {celebrate && (
          <span
            aria-hidden
            className={cx("terminal-halo absolute inset-0 rounded-full", TONE[tone].halo)}
          />
        )}
        <div
          className={cx(
            "relative flex h-16 w-16 items-center justify-center rounded-full",
            TONE[tone].badge,
            celebrate && "terminal-pop",
          )}
        >
          {icon}
        </div>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
        {title}
      </h3>
      {children && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {children}
        </p>
      )}
    </div>
  );
}

export function Notice({
  tone,
  icon,
  title,
  children,
  action,
  className,
}: {
  tone: Tone;
  icon?: ReactNode;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx(
        "flex gap-3 rounded-2xl border px-4 py-3 text-left text-sm",
        TONE[tone].notice,
        className,
      )}
    >
      {icon && (
        <span className="mt-0.5 shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1 leading-6">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

// =====================================================================
// Amounts and details
// =====================================================================

const AMOUNT_SIZES = {
  md: { value: "text-2xl", currency: "text-sm" },
  lg: { value: "text-4xl", currency: "text-base" },
  xl: { value: "text-5xl sm:text-6xl", currency: "text-lg sm:text-xl" },
} as const;

export function AmountText({
  minor,
  raw,
  size = "lg",
  placeholder = false,
}: {
  minor?: number;
  raw?: string;
  size?: keyof typeof AMOUNT_SIZES;
  placeholder?: boolean;
}) {
  const value = raw ?? (minor !== undefined ? formatAmount(minor) : "");

  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={cx(
          AMOUNT_SIZES[size].value,
          "font-semibold tabular-nums tracking-tight",
          placeholder ? "text-zinc-300 dark:text-zinc-700" : "text-zinc-900 dark:text-zinc-50",
        )}
      >
        {value}
      </span>
      <span
        className={cx(
          AMOUNT_SIZES[size].currency,
          "font-medium text-zinc-400 dark:text-zinc-500",
        )}
      >
        {CURRENCY}
      </span>
    </span>
  );
}

export function DetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode } | null | false>;
}) {
  const rows = items.filter(Boolean) as Array<{ label: string; value: ReactNode }>;

  return (
    <dl className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 text-sm dark:divide-zinc-900 dark:border-zinc-800">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-zinc-500">{row.label}</dt>
          <dd className="min-w-0 truncate text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function TechnicalDetails({ text }: { text: string }) {
  return (
    <details className="mt-3 text-left text-xs text-zinc-500">
      <summary className="w-fit cursor-pointer select-none rounded font-medium text-zinc-600 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100">
        Technical details
      </summary>
      <p className="mt-2 wrap-break-word rounded-lg bg-zinc-50 px-3 py-2 font-mono leading-5 dark:bg-zinc-900">
        {text}
      </p>
    </details>
  );
}

// =====================================================================
// Buttons
// =====================================================================

const BUTTON_VARIANT = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-900/25 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-white/25",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 dark:focus-visible:ring-white/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30",
  ghost:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-900/10 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:focus-visible:ring-white/10",
} as const;

const BUTTON_SIZE = {
  sm: "h-9 rounded-lg px-3 text-sm",
  md: "h-12 rounded-xl px-4 text-sm",
  lg: "h-14 rounded-2xl px-5 text-base",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = true,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANT;
  size?: keyof typeof BUTTON_SIZE;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 font-semibold transition focus-visible:outline-none focus-visible:ring-4 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40",
        fullWidth ? "w-full" : "w-auto",
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

// =====================================================================
// Keypad
// =====================================================================

const KEYS: KeypadKey[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"];

export function Keypad({
  onKey,
  disabled = false,
}: {
  onKey: (key: KeypadKey) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Amount keypad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          // Keep focus on the amount field so a hardware keyboard keeps working.
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onKey(key)}
          aria-label={
            key === "backspace" ? "Delete last digit" : key === "." ? "Decimal point" : key
          }
          className="flex h-14 select-none items-center justify-center rounded-2xl bg-zinc-100 text-2xl font-medium tabular-nums text-zinc-900 transition hover:bg-zinc-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 active:scale-[0.97] active:bg-zinc-200 disabled:pointer-events-none disabled:opacity-40 sm:h-16 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-100 dark:active:bg-zinc-800"
        >
          {key === "backspace" ? <Delete className="h-6 w-6" aria-hidden /> : key}
        </button>
      ))}
    </div>
  );
}