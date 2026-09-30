"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Inbox,
  RefreshCw,
  Search,
} from "lucide-react";

import { supabase } from "@/utils/supabase/clients";

import { CURRENCY, PAYMENTS_TABLE } from "../config";
import {
  businessDay,
  downloadCsv,
  isValidDay,
  methodLabel,
  needsReview,
  NOTE_MAX_LENGTH,
  type PaymentRecord,
  rangeToUtc,
  recordBadge,
  recordDate,
  recordDateTime,
  type RecordGroup,
  recordGroup,
  recordTime,
  RECORDS_COLUMNS,
  RECORDS_LIMIT,
  RECORDS_REFRESH_MS,
  RECORDS_TIME_ZONE_LABEL,
  REVIEW_RPC,
  shiftDay,
  shortRef,
  summarize,
  toCsv,
  toRecord,
} from "../records/records";
import type { Tone } from "../types";
import { formatMoney } from "../utils";
import { Button, cx, DetailList, Notice, StatusPill } from "./ui";

type Preset = "today" | "yesterday" | "week" | "custom";
type Filter = "all" | RecordGroup;
type Range = { from: string; to: string };

const PRESETS: Array<{ id: Preset; label: string }> = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "7 days" },
  { id: "custom", label: "Custom" },
];

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "review", label: "Needs review" },
  { id: "open", label: "Open" },
  { id: "not_paid", label: "Not paid" },
];

function rangeFor(preset: Exclude<Preset, "custom">): Range {
  const today = businessDay();
  if (preset === "yesterday") {
    const y = shiftDay(today, -1);
    return { from: y, to: y };
  }
  if (preset === "week") return { from: shiftDay(today, -6), to: today };
  return { from: today, to: today };
}

function errorMessage(error: unknown): string {
  return typeof error === "object" && error !== null && "message" in error
    ? String((error as { message: unknown }).message)
    : "";
}

// =====================================================================
// Page
// =====================================================================

export default function PaymentRecords() {
  const [preset, setPreset] = useState<Preset>("today");
  const [range, setRange] = useState<Range>(() => rangeFor("today"));
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only the newest request may update the screen.
  const requestRef = useRef(0);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      const requestId = ++requestRef.current;
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);

      const { startIso, endIso } = rangeToUtc(range.from, range.to);

      try {
        const { data, error: queryError } = await supabase
          .from(PAYMENTS_TABLE)
          .select(RECORDS_COLUMNS)
          .gte("created_at", startIso)
          .lt("created_at", endIso)
          .order("created_at", { ascending: false })
          .limit(RECORDS_LIMIT + 1);

        if (requestId !== requestRef.current) return;
        if (queryError) throw queryError;

        const rows = (data ?? []) as Record<string, unknown>[];
        setTruncated(rows.length > RECORDS_LIMIT);
        setRecords(
          rows
            .slice(0, RECORDS_LIMIT)
            .map(toRecord)
            .filter((r): r is PaymentRecord => r !== null),
        );
        setError(null);
        setUpdatedAt(new Date());
      } catch (loadError) {
        if (requestId !== requestRef.current) return;
        console.error("Load payment records error:", loadError);
        setError("Couldn't load payments. Check the connection and try again.");
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [range.from, range.to],
  );

  useEffect(() => {
    void load("initial");

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") void load("refresh");
    };

    const timer = window.setInterval(refreshIfVisible, RECORDS_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("online", refreshIfVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("online", refreshIfVisible);
    };
  }, [load]);

  // -------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------

  const summary = useMemo(() => summarize(records), [records]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (filter !== "all" && recordGroup(r) !== filter) return false;
      if (!q) return true;
      return (
        r.orderRef.toLowerCase().includes(q) ||
        (r.transactionId ?? "").toLowerCase().includes(q) ||
        (r.reviewNote ?? "").toLowerCase().includes(q) ||
        methodLabel(r.method).toLowerCase().includes(q) ||
        (r.amountMinor / 100).toFixed(2).includes(q)
      );
    });
  }, [records, filter, query]);

  const multiDay = range.from !== range.to;

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  function choosePreset(next: Preset) {
    setPreset(next);
    setExpandedId(null);
    if (next !== "custom") setRange(rangeFor(next));
  }

  function changeDay(edge: "from" | "to", value: string) {
    if (!isValidDay(value)) return;
    setExpandedId(null);
    setRange((current) => {
      const next = { ...current, [edge]: value };
      // Keep the range ordered whichever end moved.
      return next.from > next.to ? { from: value, to: value } : next;
    });
  }

  function exportCsv() {
    if (visible.length === 0) return;
    const name =
      range.from === range.to
        ? `payments_${range.from}.csv`
        : `payments_${range.from}_to_${range.to}.csv`;
    downloadCsv(name, toCsv(visible, CURRENCY));
  }

  const today = businessDay();

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Date range"
          options={PRESETS}
          value={preset}
          onChange={choosePreset}
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={() => void load("refresh")}
            disabled={loading}
          >
            <RefreshCw
              className={cx("h-4 w-4", refreshing && "motion-safe:animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth={false}
            onClick={exportCsv}
            disabled={loading || visible.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <DayInput label="From" value={range.from} max={today} onChange={(v) => changeDay("from", v)} />
          <DayInput label="To" value={range.to} max={today} onChange={(v) => changeDay("to", v)} />
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Paid"
          tone="success"
          value={loading ? null : formatMoney(summary.paidMinor)}
          sub={loading ? null : `${summary.paidCount} ${summary.paidCount === 1 ? "payment" : "payments"}`}
        />
        <SummaryCard
          label="Needs review"
          tone="warning"
          value={loading ? null : String(summary.counts.review)}
          sub={summary.counts.review > 0 ? "Check before closing the day" : "All clear"}
          highlight={!loading && summary.counts.review > 0}
          onClick={() => setFilter("review")}
        />
        <SummaryCard
          label="Open"
          tone="info"
          value={loading ? null : String(summary.counts.open)}
          sub="Waiting for the customer"
          onClick={() => setFilter("open")}
        />
        <SummaryCard
          label="Not paid"
          tone="neutral"
          value={loading ? null : String(summary.counts.not_paid)}
          sub="Failed, cancelled or expired"
          onClick={() => setFilter("not_paid")}
        />
      </div>

      {!loading && summary.byMethod.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.byMethod.map((m) => (
            <span
              key={m.label}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{m.label}</span>
              <span className="tabular-nums">
                {formatMoney(m.minor)} ({m.count})
              </span>
            </span>
          ))}
        </div>
      )}

      {/* List */}
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-900">
          <div className="-mx-1 overflow-x-auto px-1">
            <Segmented
              label="Status"
              options={FILTERS.map((f) => ({
                ...f,
                count: f.id === "all" ? records.length : summary.counts[f.id],
              }))}
              value={filter}
              onChange={setFilter}
              compact
            />
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">Search payments</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order, amount, transaction"
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-white/5"
            />
          </label>
        </div>

        {error && (
          <div className="p-4">
            <Notice
              tone="danger"
              icon={<AlertTriangle className="h-4 w-4" />}
              action={
                <Button variant="secondary" size="sm" fullWidth={false} onClick={() => void load("initial")}>
                  Try again
                </Button>
              }
            >
              {error}
            </Notice>
          </div>
        )}

        {loading ? (
          <ListSkeleton />
        ) : visible.length === 0 && !error ? (
          <EmptyState filtered={records.length > 0} />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {visible.map((r) => (
              <RecordRow
                key={r.id}
                record={r}
                showDate={multiDay}
                expanded={expandedId === r.id}
                onToggle={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                onSaved={() => void load("refresh")}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-1 text-xs text-zinc-500 sm:flex-row sm:justify-between">
        <span>
          Times in exhibition time ({RECORDS_TIME_ZONE_LABEL}). Totals are before refunds.
        </span>
        {updatedAt && (
          <span>
            Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
            Refreshes every {Math.round(RECORDS_REFRESH_MS / 1000)} seconds.
          </span>
        )}
      </div>

      {truncated && (
        <Notice tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
          Showing the latest {RECORDS_LIMIT} payments. Choose a shorter date range to see all of them.
        </Notice>
      )}
    </div>
  );
}

// =====================================================================
// Rows
// =====================================================================

function RecordRow({
  record: r,
  showDate,
  expanded,
  onToggle,
  onSaved,
}: {
  record: PaymentRecord;
  showDate: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const badge = recordBadge(r);
  const detailsId = `record-${r.id}`;

  return (
    <li className={cx(needsReview(r) && "bg-amber-50/40 dark:bg-amber-950/10")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3 text-left transition hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none dark:hover:bg-zinc-900/60 dark:focus-visible:bg-zinc-900/60"
      >
        <span className="w-14 text-sm tabular-nums text-zinc-500">
          {recordTime(r.createdAt)}
          {showDate && (
            <span className="block text-xs text-zinc-400">{recordDate(r.createdAt)}</span>
          )}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {shortRef(r.orderRef)}
          </span>
          <span className="block truncate text-xs text-zinc-500">{methodLabel(r.method)}</span>
        </span>

        <span className="flex items-center gap-3">
          <span className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {formatMoney(r.amountMinor)}
            </span>
            <StatusPill label={badge.label} tone={badge.tone} />
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden
          />
        </span>
      </button>

      {expanded && (
        <div
          id={detailsId}
          className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-5 dark:border-zinc-900 dark:bg-zinc-900/40"
        >
          <RecordDetails record={r} onSaved={onSaved} />
        </div>
      )}
    </li>
  );
}

function RecordDetails({ record: r, onSaved }: { record: PaymentRecord; onSaved: () => void }) {
  const partial = r.paidMinor !== null && r.paidMinor !== r.amountMinor;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-3">
        <DetailList
          items={[
            { label: "Order", value: <span className="font-mono text-xs">{r.orderRef}</span> },
            { label: "Amount", value: formatMoney(r.amountMinor) },
            partial && r.paidMinor !== null
              ? { label: "Received", value: formatMoney(r.paidMinor) }
              : null,
            { label: "Method", value: methodLabel(r.method) },
            { label: "Created", value: recordDateTime(r.createdAt) },
            r.paidAt ? { label: "Paid", value: recordDateTime(r.paidAt) } : null,
            r.transactionId
              ? { label: "Transaction", value: <span className="font-mono text-xs">{r.transactionId}</span> }
              : null,
            r.providerState ? { label: "Provider state", value: r.providerState } : null,
          ]}
        />
      </div>

      <div className="space-y-3">
        {r.reviewReason && (
          <Notice
            tone={needsReview(r) ? "warning" : "neutral"}
            icon={<AlertTriangle className="h-4 w-4" />}
            title={needsReview(r) ? "Needs review" : `Reviewed ${recordDateTime(r.reviewedAt)}`}
          >
            <span className="break-words">{r.reviewReason}</span>
          </Notice>
        )}

        {r.failureReason && r.status !== "paid" && (
          <Notice tone="neutral" title="Why it wasn't paid">
            <span className="break-words">{r.failureReason}</span>
          </Notice>
        )}

        <ReviewForm record={r} onSaved={onSaved} />
      </div>
    </div>
  );
}

function ReviewForm({ record: r, onSaved }: { record: PaymentRecord; onSaved: () => void }) {
  const [note, setNote] = useState(r.reviewNote ?? "");
  const [saving, setSaving] = useState<null | "note" | "review">(null);
  const [result, setResult] = useState<{ tone: Tone; text: string } | null>(null);

  const dirty = note.trim() !== (r.reviewNote ?? "").trim();
  const canReview = needsReview(r);
  const noteId = `note-${r.id}`;

  async function save(markReviewed: boolean) {
    if (saving) return;
    setSaving(markReviewed ? "review" : "note");
    setResult(null);

    try {
      const { error } = await supabase.rpc(REVIEW_RPC, {
        p_payment_id: r.id,
        p_note: note.trim() || null,
        p_mark_reviewed: markReviewed,
      });
      if (error) throw error;

      setResult({ tone: "success", text: markReviewed ? "Marked as reviewed." : "Note saved." });
      onSaved();
    } catch (saveError) {
      const msg = errorMessage(saveError);
      setResult({
        tone: "danger",
        text: msg.includes("FORBIDDEN")
          ? "This account can't update payments."
          : msg.includes("NOTE_TOO_LONG")
          ? `Notes can be up to ${NOTE_MAX_LENGTH} characters.`
          : "Couldn't save. Check the connection and try again.",
      });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <label htmlFor={noteId} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Manager note
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
        placeholder="For example: refunded in the dashboard, customer returned size M."
        className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-white/5"
      />

      {result && (
        <Notice tone={result.tone} className="mt-3">
          {result.text}
        </Notice>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={() => void save(false)}
          loading={saving === "note"}
          disabled={!dirty || saving !== null}
        >
          Save note
        </Button>
        {canReview && (
          <Button
            size="sm"
            fullWidth={false}
            onClick={() => void save(true)}
            loading={saving === "review"}
            disabled={saving !== null}
          >
            Mark as reviewed
          </Button>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Small pieces
// =====================================================================

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  options: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={cx(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
              compact ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-sm",
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cx("tabular-nums", active ? "text-zinc-500" : "text-zinc-400")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function DayInput({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-500">
      {label}
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:[color-scheme:dark]"
      />
    </label>
  );
}

const CARD_ACCENT: Record<Tone, string> = {
  neutral: "bg-zinc-400",
  info: "bg-sky-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

function SummaryCard({
  label,
  value,
  sub,
  tone,
  highlight = false,
  onClick,
}: {
  label: string;
  value: string | null;
  sub: string | null;
  tone: Tone;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className={cx("h-1.5 w-1.5 rounded-full", CARD_ACCENT[tone])} aria-hidden />
        {label}
      </span>
      {value === null ? (
        <span className="mt-2 block h-7 w-24 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-900" />
      ) : (
        <span className="mt-1 block truncate text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
          {value}
        </span>
      )}
      {sub && <span className="mt-0.5 block truncate text-xs text-zinc-500">{sub}</span>}
    </>
  );

  const className = cx(
    "rounded-2xl border bg-white p-4 text-left dark:bg-zinc-950",
    highlight
      ? "border-amber-300 ring-4 ring-amber-100 dark:border-amber-800 dark:ring-amber-950/50"
      : "border-zinc-200 dark:border-zinc-800",
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        className,
        "transition hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:hover:border-zinc-700",
      )}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-zinc-100 dark:divide-zinc-900" aria-label="Loading payments">
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <span className="h-4 w-10 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <span className="h-4 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <span className="h-4 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
        <Inbox className="h-5 w-5" aria-hidden />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {filtered ? "No payments match" : "No payments yet"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        {filtered
          ? "Try another status or clear the search."
          : "Payments taken on the terminal appear here."}
      </p>
    </div>
  );
}
