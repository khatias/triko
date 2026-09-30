import type { PaymentStatus, Tone } from "../types";

// =====================================================================
// Records configuration
// =====================================================================

/** Day boundaries and times on the records page use exhibition time. */
export const RECORDS_TIME_ZONE = "Asia/Riyadh";
/** UTC+3 with no daylight saving, so a fixed offset is exact. */
export const RECORDS_UTC_OFFSET_MINUTES = 180;
export const RECORDS_TIME_ZONE_LABEL = "UTC+3";

export const RECORDS_LIMIT = 1000;
export const RECORDS_REFRESH_MS = 30_000;
export const REVIEW_RPC = "review_saudi_payment";
export const NOTE_MAX_LENGTH = 1000;
export const RECORDS_COLUMNS =
  "id, public_ref, order_ref, amount_halalas, status, provider_state, payment_method, payssion_transaction_id, created_at, paid_at, provider_paid_halalas, requires_review, review_reason, reviewed_at, review_note, failure_reason, provider_data";

const METHOD_LABELS: Record<string, string> = {
  card_sa: "Card",
  mada_sa: "mada",
  applepay_sa: "Apple Pay",
  stcpay_sa: "STC Pay",
  payssion_test: "Test",
  hosted_page: "Not chosen",
};

// =====================================================================
// Types and parsing
// =====================================================================

export type PaymentRecord = {
  id: string;
  orderRef: string;
  amountMinor: number;
  status: PaymentStatus;
  providerState: string | null;
  method: string | null;
  transactionId: string | null;
  createdAt: string;
  paidAt: string | null;
  paidMinor: number | null;
  requiresReview: boolean;
  reviewReason: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  failureReason: string | null;
};

export type RecordGroup = "paid" | "review" | "open" | "not_paid";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function int(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
  }
  return null;
}

function status(value: unknown): PaymentStatus {
  return value === "paid" || value === "failed" || value === "cancelled" || value === "expired"
    ? value
    : "pending";
}

/** The method the customer actually used, wherever this schema stores it. */
function pickMethod(row: Record<string, unknown>): string | null {
  const data = row.provider_data;
  const fromTopLevel =
    typeof data === "object" && data !== null
      ? text((data as Record<string, unknown>).pm_id)
      : null;
  const tx =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>).transaction
      : null;
  const fromData =
    typeof tx === "object" && tx !== null ? text((tx as Record<string, unknown>).pm_id) : null;

  return fromTopLevel ?? fromData ?? text(row.payment_method);
}

export function toRecord(row: Record<string, unknown>): PaymentRecord | null {
  const amountMinor = int(row.amount_halalas);
  const createdAt = text(row.created_at);

  if (typeof row.id !== "string" || amountMinor === null || !createdAt) return null;

  return {
    id: row.id,
    orderRef: text(row.public_ref) ?? text(row.order_ref) ?? row.id,
    amountMinor,
    status: status(row.status),
    providerState: text(row.provider_state),
    method: pickMethod(row),
    transactionId: text(row.payssion_transaction_id),
    createdAt,
    paidAt: text(row.paid_at),
    paidMinor: int(row.provider_paid_halalas),
    requiresReview: row.requires_review === true,
    reviewReason: text(row.review_reason),
    reviewedAt: text(row.reviewed_at),
    reviewNote: text(row.review_note),
    failureReason: text(row.failure_reason),
  };
}

// =====================================================================
// Classification
// =====================================================================

export function methodLabel(pmId: string | null): string {
  if (!pmId) return "Not chosen";
  if (METHOD_LABELS[pmId]) return METHOD_LABELS[pmId];
  if (/card|visa|master/i.test(pmId)) return "Card";
  return pmId;
}

export function needsReview(r: PaymentRecord): boolean {
  return r.requiresReview && !r.reviewedAt;
}

export function isRefunded(r: PaymentRecord): boolean {
  return r.providerState !== null && /refund/i.test(r.providerState);
}

export function recordGroup(r: PaymentRecord): RecordGroup {
  if (needsReview(r)) return "review";
  if (r.status === "paid") return "paid";
  if (r.status === "pending") return "open";
  return "not_paid";
}

export function recordBadge(r: PaymentRecord): { label: string; tone: Tone } {
  if (needsReview(r)) return { label: "Needs review", tone: "warning" };
  if (isRefunded(r)) return { label: "Refunded", tone: "neutral" };
  switch (r.status) {
    case "paid":
      return { label: "Paid", tone: "success" };
    case "pending":
      return { label: "Open", tone: "info" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
    case "expired":
      return { label: "Expired", tone: "neutral" };
    default:
      return { label: "Failed", tone: "danger" };
  }
}

/** Long UUID references shortened for scanning; full value shown in details. */
export function shortRef(ref: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ref) ? ref.slice(0, 8).toUpperCase() : ref;
}

// =====================================================================
// Summary
// =====================================================================

export type RecordsSummary = {
  paidCount: number;
  paidMinor: number;
  counts: Record<RecordGroup, number>;
  byMethod: Array<{ label: string; count: number; minor: number }>;
};

export function summarize(records: PaymentRecord[]): RecordsSummary {
  const counts: Record<RecordGroup, number> = { paid: 0, review: 0, open: 0, not_paid: 0 };
  const methods = new Map<string, { count: number; minor: number }>();
  let paidCount = 0;
  let paidMinor = 0;

  for (const r of records) {
    counts[recordGroup(r)] += 1;

    if (r.status === "paid") {
      paidCount += 1;
      paidMinor += r.amountMinor;
      const label = methodLabel(r.method);
      const entry = methods.get(label) ?? { count: 0, minor: 0 };
      entry.count += 1;
      entry.minor += r.amountMinor;
      methods.set(label, entry);
    }
  }

  return {
    paidCount,
    paidMinor,
    counts,
    byMethod: Array.from(methods, ([label, v]) => ({ label, ...v })).sort(
      (a, b) => b.minor - a.minor,
    ),
  };
}

// =====================================================================
// Dates (exhibition time)
// =====================================================================

const dayParts = new Intl.DateTimeFormat("en-US", {
  timeZone: RECORDS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date at the exhibition, as YYYY-MM-DD. */
export function businessDay(date: Date = new Date()): string {
  const parts = Object.fromEntries(dayParts.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function isValidDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

export function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** Inclusive day range in exhibition time -> half-open UTC range. */
export function rangeToUtc(from: string, to: string): { startIso: string; endIso: string } {
  const [a, b] = from <= to ? [from, to] : [to, from];
  const offset = RECORDS_UTC_OFFSET_MINUTES * 60_000;
  const [fy, fm, fd] = a.split("-").map(Number);
  const [ty, tm, td] = b.split("-").map(Number);
  return {
    startIso: new Date(Date.UTC(fy, fm - 1, fd) - offset).toISOString(),
    endIso: new Date(Date.UTC(ty, tm - 1, td + 1) - offset).toISOString(),
  };
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: RECORDS_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: RECORDS_TIME_ZONE,
  month: "short",
  day: "numeric",
});

function validDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function recordTime(iso: string | null): string {
  const d = validDate(iso);
  return d ? timeFormatter.format(d) : "";
}

export function recordDate(iso: string | null): string {
  const d = validDate(iso);
  return d ? dateFormatter.format(d) : "";
}

export function recordDateTime(iso: string | null): string {
  const d = validDate(iso);
  return d ? `${dateFormatter.format(d)}, ${timeFormatter.format(d)}` : "";
}

// =====================================================================
// CSV export
// =====================================================================

function csvCell(value: string | number | null): string {
  let s = value === null ? "" : String(value);
  // Stop spreadsheet apps from running cell contents as formulas.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(records: PaymentRecord[], currency: string): string {
  const header = [
    "Date", "Time", "Order", "Amount", "Currency", "Method", "Status",
    "Provider state", "Needs review", "Review reason", "Manager note",
    "Transaction ID", "Paid at", "Failure reason",
  ];

  const rows = records.map((r) => [
    businessDay(new Date(r.createdAt)),
    recordTime(r.createdAt),
    r.orderRef,
    (r.amountMinor / 100).toFixed(2),
    currency,
    methodLabel(r.method),
    recordBadge(r).label,
    r.providerState,
    needsReview(r) ? "Yes" : "No",
    r.reviewReason,
    r.reviewNote,
    r.transactionId,
    recordDateTime(r.paidAt),
    r.failureReason,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
