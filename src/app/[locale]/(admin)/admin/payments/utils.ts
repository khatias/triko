import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import {
  ACTIVE_PAYMENT_KEY,
  CURRENCY,
  LOCALE,
  MAX_AMOUNT_MINOR,
  MAX_WHOLE_DIGITS,
  MIN_AMOUNT_MINOR,
  SPENT_REQUEST_CODES,
} from "./config";
import type {
  InvokeFailure,
  KeypadKey,
  Payment,
  PaymentStatus,
  View,
} from "./types";

// =====================================================================
// Money
// =====================================================================

const amountFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 125050 -> "1,250.50" */
export function formatAmount(minor: number): string {
  return amountFormatter.format(minor / 100);
}

/** 125050 -> "1,250.50 SAR" */
export function formatMoney(minor: number): string {
  return `${formatAmount(minor)} ${CURRENCY}`;
}

/** Adds grouping to what the user typed without changing it: "1250.5" -> "1,250.5" */
export function formatTypedAmount(raw: string): string {
  if (!raw) return "";
  const dot = raw.indexOf(".");
  const whole = dot === -1 ? raw : raw.slice(0, dot);
  const grouped = (whole || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dot === -1 ? grouped : `${grouped}.${raw.slice(dot + 1)}`;
}

/** "12" -> 1200, "12.5" -> 1250, "12.05" -> 1205. Anything else -> null. */
export function parseAmountToMinor(value: string): number | null {
  const v = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(v)) return null;

  const [wholePart, fractionPart = ""] = v.split(".");
  const minor = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, "0"));

  return Number.isSafeInteger(minor) ? minor : null;
}

/** Returns a short problem description, or null when the amount is usable. */
export function amountProblem(minor: number | null): string | null {
  if (minor === null) return null;
  if (minor < MIN_AMOUNT_MINOR) return `Minimum is ${formatMoney(MIN_AMOUNT_MINOR)}.`;
  if (minor > MAX_AMOUNT_MINOR) return `Maximum is ${formatMoney(MAX_AMOUNT_MINOR)}.`;
  return null;
}

/** Arabic-Indic and Persian digits, Arabic decimal and thousands marks -> ASCII. */
function normalizeDigits(value: string): string {
  return value
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\u066B/g, ".")
    .replace(/\u066C/g, "");
}

/**
 * Cleans free-form input into "digits[.dd]".
 *   "1,250.00" -> "1250.00"  (comma as thousands separator)
 *   "12,5"     -> "12.5"     (comma as decimal separator)
 *   "٢٥٠"      -> "250"      (Arabic-Indic digits)
 */
export function sanitizeAmountInput(value: string): string {
  let s = normalizeDigits(value).replace(/\s/g, "");

  if (s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (/^\d*,\d{0,2}$/.test(s)) {
    s = s.replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  s = s.replace(/[^\d.]/g, "");

  const dot = s.indexOf(".");
  const whole = (dot === -1 ? s : s.slice(0, dot))
    .replace(/^0+(?=\d)/, "")
    .slice(0, MAX_WHOLE_DIGITS);

  if (dot === -1) return whole;

  const fraction = s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  return `${whole || "0"}.${fraction}`;
}

export function applyKeypadKey(current: string, key: KeypadKey): string {
  if (key === "backspace") return current.slice(0, -1);
  return sanitizeAmountInput(current + key);
}

// =====================================================================
// Server data
// =====================================================================

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function toStatus(value: unknown): PaymentStatus {
  return value === "paid" ||
      value === "failed" ||
      value === "cancelled" ||
      value === "expired"
    ? value
    : "pending";
}

/** Accepts numbers and digit strings (bigint/numeric columns). */
function toSafeInt(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
  }
  return null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function rowToPayment(row: Record<string, unknown>): Payment | null {
  const amountMinor = toSafeInt(row.amount_halalas);

  if (
    typeof row.id !== "string" ||
    typeof row.public_ref !== "string" ||
    amountMinor === null ||
    typeof row.currency !== "string" ||
    row.currency.trim().toUpperCase() !== CURRENCY
  ) {
    return null;
  }

  return {
    id: row.id,
    orderRef: row.public_ref,
    checkoutUrl: isHttpsUrl(row.checkout_url) ? row.checkout_url : null,
    amountMinor,
    status: toStatus(row.status),
    providerState: toText(row.provider_state),
    providerPaidMinor: toSafeInt(row.provider_paid_halalas),
    failureReason: toText(row.failure_reason),
    requiresReview: row.requires_review === true,
    reviewReason: toText(row.review_reason),
    createdAt: toText(row.created_at),
    paidAt: toText(row.paid_at),
  };
}

export function responseToPayment(
  data: unknown,
  expectedMinor: number,
): Payment | null {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;

  if (
    typeof d.payment_id !== "string" ||
    typeof d.order_ref !== "string" ||
    !isHttpsUrl(d.checkout_url) ||
    d.currency !== CURRENCY ||
    toSafeInt(d.amount_halalas) !== expectedMinor
  ) {
    return null;
  }

  return {
    id: d.payment_id,
    orderRef: d.order_ref,
    checkoutUrl: d.checkout_url,
    amountMinor: expectedMinor,
    status: toStatus(d.status),
    providerState: null,
    providerPaidMinor: null,
    failureReason: null,
    requiresReview: false,
    reviewReason: null,
    // Local clock, so the elapsed timer can't be skewed by server time.
    createdAt: new Date().toISOString(),
    paidAt: null,
  };
}

export function viewFor(p: Payment): View {
  if (p.status === "paid") return "paid";
  if (p.status !== "pending") return "closed";
  if (p.providerState === "awaiting_confirm") return "awaiting_confirm";
  if (p.providerState === "paid_partial") return "paid_partial";
  if (p.providerState === "paid_more") return "paid_more";
  if (p.requiresReview) return "flagged";
  return p.checkoutUrl ? "qr" : "qr_missing";
}

// =====================================================================
// Time
// =====================================================================

/** 75_000 -> "1:15", 3_725_000 -> "1:02:05" */
export function formatElapsed(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

export function elapsedSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const start = Date.parse(iso);
  return Number.isFinite(start) ? now - start : null;
}

export function formatClock(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

// =====================================================================
// Browser
// =====================================================================

/** localStorage can throw (private mode, quota, disabled storage). */
export const storage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(ACTIVE_PAYMENT_KEY);
    } catch {
      return null;
    }
  },
  set(id: string): void {
    try {
      window.localStorage.setItem(ACTIVE_PAYMENT_KEY, id);
    } catch {
      /* the terminal still works; it just won't survive a refresh */
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(ACTIVE_PAYMENT_KEY);
    } catch {
      /* ignore */
    }
  },
};

/**
 * crypto.randomUUID only exists in secure contexts (https, localhost).
 * Tablets opened over plain http on a LAN need the fallback.
 */
export function newRequestId(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID();

  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

// =====================================================================
// Errors
// =====================================================================

const GENERIC_CREATE_ERROR = "Couldn't create the payment. Try again.";

/** Staff-facing text for every code the create function returns. */
export const ERROR_TEXT: Record<string, string> = {
  UNAUTHORIZED: "Your session has expired. Sign in again to take payments.",
  FORBIDDEN: "This account isn't allowed to take payments.",
  INVALID_AMOUNT: `Enter an amount from ${formatMoney(MIN_AMOUNT_MINOR)} to ${formatMoney(MAX_AMOUNT_MINOR)}.`,
  INVALID_BODY: GENERIC_CREATE_ERROR,
  INVALID_REQUEST_ID: GENERIC_CREATE_ERROR,
  REQUEST_ID_REUSED: GENERIC_CREATE_ERROR,
  CREATION_IN_PROGRESS: "This payment is still being created. Try again in a few seconds.",
  CREATION_UNCERTAIN: "The last attempt was interrupted. Create the QR again.",
  PROVIDER_REJECTED: "The payment provider declined to create this payment. Check the amount and try again.",
  PROVIDER_UNAVAILABLE: "The payment provider didn't respond. Try again.",
  SERVER_CONFIG: "Payments aren't set up correctly. Contact the administrator.",
  SERVER_ERROR: GENERIC_CREATE_ERROR,
  METHOD_NOT_ALLOWED: GENERIC_CREATE_ERROR,
};

export async function readInvokeError(err: unknown): Promise<InvokeFailure> {
  if (err instanceof FunctionsHttpError) {
    const response = err.context as Response | undefined;
    let body: Record<string, unknown> | null = null;

    try {
      body = response ? await response.clone().json() : null;
    } catch {
      body = null;
    }

    const code = typeof body?.error === "string" ? body.error : "";
    const status = response?.status ?? 0;

    // Server messages are never shown raw: they can name internals.
    const message =
      ERROR_TEXT[code] ??
      (status === 401
        ? ERROR_TEXT.UNAUTHORIZED
        : status === 403
        ? ERROR_TEXT.FORBIDDEN
        : status === 404
        ? "The payment service isn't available. Contact the administrator."
        : GENERIC_CREATE_ERROR);

    return { message, keepRequestId: !SPENT_REQUEST_CODES.has(code) };
  }

  if (err instanceof FunctionsFetchError || err instanceof FunctionsRelayError) {
    // The request may have reached the server. Retrying with the same
    // request ID returns the same payment instead of a duplicate.
    return {
      message: "The connection dropped before the server answered. Try again. It won't charge twice.",
      keepRequestId: true,
    };
  }

  return { message: GENERIC_CREATE_ERROR, keepRequestId: true };
}

/** PostgREST "no rows" (missing row, or hidden by RLS). */
export function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "PGRST116"
  );
}

export function cancelErrorMessage(message: string | undefined): string {
  const m = message ?? "";
  if (m.includes("PAYMENT_IN_PROGRESS")) {
    return "The customer has already started paying. Wait for the result.";
  }
  if (m.includes("FORBIDDEN")) return "This account isn't allowed to cancel payments.";
  if (m.includes("PAYMENT_NOT_FOUND")) return "This payment no longer exists.";
  return "Couldn't cancel. Check the connection and try again.";
}
