"use client";

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  CircleX,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { supabase } from "@/utils/supabase/clients";

import {
  CANCEL_PAYMENT_RPC,
  COPY_FEEDBACK_MS,
  CREATE_PAYMENT_FUNCTION,
  FAILURES_BEFORE_WARNING,
  MAX_AMOUNT_MINOR,
  MIN_AMOUNT_MINOR,
  PAYMENT_COLUMNS,
  PAYMENTS_TABLE,
  POLL_FAST_MS,
  POLL_FAST_WINDOW_MS,
  POLL_GIVE_UP_MS,
  POLL_SLOW_MS,
} from "../config";
import {
  announcement,
  closedCopy,
  paidCopy,
  pendingCopy,
  VIEW_META,
} from "../content";
import { useNow, useOnline, useWakeLock } from "../hooks";
import type { CancelStep, CopyState, KeypadKey, Payment } from "../types";
import {
  amountProblem,
  applyKeypadKey,
  cancelErrorMessage,
  elapsedSince,
  ERROR_TEXT,
  formatClock,
  formatElapsed,
  formatMoney,
  formatTypedAmount,
  isNotFoundError,
  isOffline,
  newRequestId,
  parseAmountToMinor,
  readInvokeError,
  responseToPayment,
  rowToPayment,
  sanitizeAmountInput,
  storage,
  viewFor,
} from "../utils";
import {
  AmountText,
  Button,
  cx,
  DetailList,
  Keypad,
  Notice,
  Shell,
  StateHero,
  StatusPill,
  TechnicalDetails,
} from "./ui";

/** Must match DESCRIPTION_MAX in the create-saudi-payment function. */
const NOTE_MAX_LENGTH = 200;

export default function PaymentTerminal() {
  // -------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);

  const [restoring, setRestoring] = useState(true);
  const [restoreFailedId, setRestoreFailedId] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncWarning, setSyncWarning] = useState(false);

  const [connectionIssue, setConnectionIssue] = useState(false);
  const [pollPaused, setPollPaused] = useState(false);
  const [pollNonce, setPollNonce] = useState(0);

  const [cancelStep, setCancelStep] = useState<CancelStep>("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<number | undefined>(undefined);
  // Reused across retries of the same sale so the server can dedupe.
  const requestIdRef = useRef<string | null>(null);
  // The payment the screen belongs to. Late responses for any other
  // payment are dropped, so "New payment" can't be undone by a poll.
  const activeIdRef = useRef<string | null>(null);

  const online = useOnline();
  const view = payment ? viewFor(payment) : null;
  const isPending = payment?.status === "pending";
  const now = useNow(view === "qr");

  useWakeLock(isPending);

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

  // -------------------------------------------------------------------
  // Data access
  // -------------------------------------------------------------------

  const fetchPayment = useCallback(async (id: string): Promise<Payment> => {
    const { data, error: queryError } = await supabase
      .from(PAYMENTS_TABLE)
      .select(PAYMENT_COLUMNS)
      .eq("id", id)
      .single();

    if (queryError) throw queryError;
    const parsed = data
      ? rowToPayment(data as unknown as Record<string, unknown>)
      : null;
    if (!parsed) throw new Error("INVALID_PAYMENT_ROW");
    return parsed;
  }, []);

  const applyPayment = useCallback((p: Payment) => {
    if (activeIdRef.current === p.id) setPayment(p);
  }, []);

  // -------------------------------------------------------------------
  // Restore after a refresh
  // -------------------------------------------------------------------

  const restore = useCallback(
    async (id: string, isCancelled: () => boolean) => {
      activeIdRef.current = id;
      setRestoreFailedId(null);

      try {
        const p = await fetchPayment(id);
        if (!isCancelled()) applyPayment(p);
      } catch (restoreError) {
        if (isCancelled() || activeIdRef.current !== id) return;
        console.error("Restore payment error:", restoreError);

        if (isNotFoundError(restoreError)) {
          activeIdRef.current = null;
          storage.clear();
        } else {
          // Probably offline. Keep the ID so an open sale isn't lost.
          setRestoreFailedId(id);
        }
      }
    },
    [fetchPayment, applyPayment],
  );

  useEffect(() => {
    let cancelled = false;
    const id = storage.get();

    if (!id) {
      setRestoring(false);
      return;
    }

    void restore(id, () => cancelled).finally(() => {
      if (!cancelled) setRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, [restore]);

  function retryRestore() {
    if (!restoreFailedId) return;
    setRestoring(true);
    void restore(restoreFailedId, () => false).finally(() =>
      setRestoring(false),
    );
  }

  // -------------------------------------------------------------------
  // Poll while pending
  // -------------------------------------------------------------------

  const paymentId = payment?.id ?? null;
  const paymentStatus = payment?.status ?? null;

  useEffect(() => {
    if (!paymentId || paymentStatus !== "pending") return;
    const id = paymentId;

    let stopped = false;
    let inFlight = false;
    let timer: number | undefined;
    let failures = 0;
    const startedAt = Date.now();

    setPollPaused(false);

    async function tick() {
      if (stopped || inFlight) return;
      inFlight = true;

      try {
        const latest = await fetchPayment(id);
        if (stopped) return;
        failures = 0;
        setConnectionIssue(false);
        applyPayment(latest);
        // A status change re-runs this effect, which ends this loop.
        if (latest.status !== "pending") return;
      } catch (pollError) {
        if (stopped) return;
        failures += 1;
        if (failures >= FAILURES_BEFORE_WARNING) setConnectionIssue(true);
        console.error("Payment status error:", pollError);
      } finally {
        inFlight = false;
      }

      if (stopped) return;

      const elapsed = Date.now() - startedAt;
      if (elapsed >= POLL_GIVE_UP_MS) {
        setPollPaused(true);
        return;
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => void tick(),
        elapsed < POLL_FAST_WINDOW_MS ? POLL_FAST_MS : POLL_SLOW_MS,
      );
    }

    // Check immediately when the tab comes back or the network returns.
    function checkNow() {
      if (stopped || inFlight) return;
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      void tick();
    }

    void tick();
    document.addEventListener("visibilitychange", checkNow);
    window.addEventListener("online", checkNow);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", checkNow);
      window.removeEventListener("online", checkNow);
    };
  }, [paymentId, paymentStatus, pollNonce, fetchPayment, applyPayment]);

  // -------------------------------------------------------------------
  // Sale entry
  // -------------------------------------------------------------------

  const amountMinor = parseAmountToMinor(amount);
  const problem = amount ? amountProblem(amountMinor) : null;
  const amountReady = amountMinor !== null && problem === null;

  function updateAmount(next: string) {
    // A different amount is a different payment attempt.
    if (next !== amount) requestIdRef.current = null;
    setAmount(next);
    setError(null);
  }

  function updateNote(next: string) {
    // A different description is also a different payment attempt.
    if (next !== note) requestIdRef.current = null;
    setNote(next.slice(0, NOTE_MAX_LENGTH));
    setError(null);
  }

  function handleKey(key: KeypadKey) {
    if (creating) return;
    updateAmount(applyKeypadKey(amount, key));
  }

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  async function createPayment(event: SyntheticEvent) {
    event.preventDefault();
    if (creating) return;

    const minor = parseAmountToMinor(amount);

    if (minor === null) {
      setError("Enter an amount, like 125 or 125.50.");
      return;
    }
    if (minor < MIN_AMOUNT_MINOR || minor > MAX_AMOUNT_MINOR) {
      setError(ERROR_TEXT.INVALID_AMOUNT);
      return;
    }
    if (isOffline()) {
      setError("You're offline. Connect to the internet, then try again.");
      return;
    }

    const description = note.trim() || undefined;
    const requestId = requestIdRef.current ?? newRequestId();
    requestIdRef.current = requestId;

    setCreating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        CREATE_PAYMENT_FUNCTION,
        {
          body: {
            amount_halalas: minor,
            client_request_id: requestId,
            description,
          },
        },
      );

      if (invokeError) {
        const failure = await readInvokeError(invokeError);
        if (!failure.keepRequestId) requestIdRef.current = null;
        setError(failure.message);
        return;
      }

      const created = responseToPayment(data, minor);
      if (!created) {
        // Request ID kept: retrying returns the same payment.
        setError("The server sent an unexpected response. Try again.");
        return;
      }

      requestIdRef.current = null;
      activeIdRef.current = created.id;
      storage.set(created.id);
      setSyncWarning(
        typeof data === "object" &&
          data !== null &&
          (data as Record<string, unknown>).sync_warning === true,
      );
      setConnectionIssue(false);
      setCancelStep("idle");
      setCancelError(null);
      setConfirmLeave(false);
      setCopyState("idle");
      setPayment(created);
    } catch (createError) {
      console.error("Create payment error:", createError);
      setError("Couldn't reach the server. Try again. It won't charge twice.");
    } finally {
      setCreating(false);
    }
  }

  async function cancelPayment() {
    if (!payment || cancelStep === "working") return;
    const id = payment.id;

    setCancelStep("working");
    setCancelError(null);

    try {
      const { error: rpcError } = await supabase.rpc(CANCEL_PAYMENT_RPC, {
        p_payment_id: id,
      });

      if (rpcError) {
        setCancelError(cancelErrorMessage(rpcError.message));
        setCancelStep("confirm");
      } else {
        setCancelStep("idle");
      }
    } catch {
      setCancelError(cancelErrorMessage(undefined));
      setCancelStep("confirm");
    }

    try {
      applyPayment(await fetchPayment(id));
    } catch {
      /* polling will catch up */
    }
  }

  function startNewPayment() {
    activeIdRef.current = null;
    requestIdRef.current = null;
    storage.clear();
    window.clearTimeout(copyTimerRef.current);

    setPayment(null);
    setRestoreFailedId(null);
    setAmount("");
    setNote("");
    setError(null);
    setSyncWarning(false);
    setConnectionIssue(false);
    setPollPaused(false);
    setCancelStep("idle");
    setCancelError(null);
    setConfirmLeave(false);
    setCopyState("idle");
  }

  async function copyLink() {
    if (!payment?.checkoutUrl) return;
    window.clearTimeout(copyTimerRef.current);

    try {
      await navigator.clipboard.writeText(payment.checkoutUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    copyTimerRef.current = window.setTimeout(
      () => setCopyState("idle"),
      COPY_FEEDBACK_MS,
    );
  }

  // -------------------------------------------------------------------
  // Render: loading and restore failure
  // -------------------------------------------------------------------

  const offlinePill = !online ? (
    <StatusPill label="Offline" tone="danger" />
  ) : null;

  if (restoring) {
    return (
      <Shell title="Payment terminal">
        <div className="flex flex-col items-center py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" aria-hidden />
          <p className="mt-3 text-sm text-zinc-500">Loading terminal…</p>
        </div>
      </Shell>
    );
  }

  if (!payment && restoreFailedId) {
    return (
      <Shell title="Payment terminal" status={offlinePill}>
        <div className="mx-auto max-w-sm">
          <StateHero
            tone="warning"
            icon={<WifiOff className="h-7 w-7" aria-hidden />}
            title="Couldn't load the open payment"
          >
            A payment was in progress on this device, but the server can&apos;t
            be reached. Check the connection and try again.
          </StateHero>

          <div className="mt-8 grid gap-3">
            <Button size="lg" onClick={retryRestore}>
              <RotateCcw className="h-5 w-5" aria-hidden />
              Try again
            </Button>
            <Button variant="ghost" onClick={startNewPayment}>
              Start a new payment instead
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  // -------------------------------------------------------------------
  // Render: sale entry
  // -------------------------------------------------------------------

  if (!payment) {
    return (
      <Shell title="New payment" status={offlinePill}>
        <form onSubmit={createPayment} noValidate className="mx-auto max-w-sm">
          <label
            htmlFor="terminal-amount"
            className="block text-center text-sm font-medium text-zinc-500"
          >
            Amount to charge
          </label>

          {/* The real input is visually hidden. inputMode="none" keeps the
              phone keyboard closed so the on-screen keypad is used, while
              hardware keyboards and paste still work. Only the amount
              lives inside this box: tapping it focuses the amount input. */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="mt-2 cursor-text rounded-2xl px-3 py-5 text-center transition focus-within:bg-zinc-50 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:bg-zinc-900/60 dark:focus-within:ring-white/10"
          >
            <input
              ref={inputRef}
              id="terminal-amount"
              type="text"
              inputMode="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              enterKeyHint="go"
              value={amount}
              onChange={(e) =>
                updateAmount(sanitizeAmountInput(e.target.value))
              }
              aria-invalid={Boolean(error || problem)}
              aria-describedby={
                amountMinor === MAX_AMOUNT_MINOR
                  ? "terminal-amount-hint terminal-amount-limit-note"
                  : "terminal-amount-hint"
              }
              disabled={creating}
              className="sr-only"
            />
            <div aria-hidden className="min-h-18">
              <AmountText
                size="xl"
                raw={amount ? formatTypedAmount(amount) : "0.00"}
                placeholder={!amount}
              />
            </div>
          </div>

          <p
            id="terminal-amount-hint"
            className={cx(
              "mt-1 flex min-h-5 items-center justify-center gap-3 text-center text-xs",
              problem ? "text-red-600 dark:text-red-400" : "text-zinc-500",
            )}
          >
            <span>
              {problem ??
                `Minimum ${formatMoney(MIN_AMOUNT_MINOR)}. Maximum ${formatMoney(MAX_AMOUNT_MINOR)}.`}
            </span>
            {amount && !creating && (
              <button
                type="button"
                onClick={() => {
                  updateAmount("");
                  inputRef.current?.focus();
                }}
                className="rounded font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Clear
              </button>
            )}
          </p>

          {amountMinor === MAX_AMOUNT_MINOR && (
            <Notice
              tone="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
              className="mt-3"
            >
              <span id="terminal-amount-limit-note">
                10,000 SAR is available only for eligible Card, mada, or Apple
                Pay payments. The customer&apos;s issuer or another payment
                method may have a lower limit.
              </span>
            </Notice>
          )}

          <div className="mt-6">
            <Keypad onKey={handleKey} disabled={creating} />
          </div>

          {/* What's being sold: shown to the customer on the order page
              and on their receipt, and kept in the records. */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="terminal-note"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                What&apos;s being sold{" "}
                <span className="font-normal text-zinc-400">(optional)</span>
              </label>
              {note.length > NOTE_MAX_LENGTH - 40 && (
                <span className="text-xs tabular-nums text-zinc-400">
                  {note.length}/{NOTE_MAX_LENGTH}
                </span>
              )}
            </div>
            <input
              id="terminal-note"
              type="text"
              value={note}
              onChange={(e) => updateNote(e.target.value)}
              maxLength={NOTE_MAX_LENGTH}
              autoComplete="off"
              enterKeyHint="done"
              disabled={creating}
              placeholder="2 briefs, 1 set, size M"
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-white/5"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              The customer sees this on their order and receipt.
            </p>
          </div>

          {error && (
            <Notice
              tone="danger"
              icon={<AlertTriangle className="h-4 w-4" />}
              className="mt-5"
            >
              {error}
            </Notice>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-6"
            loading={creating}
            disabled={!amountReady}
          >
            {creating ? (
              "Creating payment…"
            ) : (
              <>
                <QrCode className="h-5 w-5" aria-hidden />
                {amountReady
                  ? `Create QR for ${formatMoney(amountMinor)}`
                  : "Create payment QR"}
              </>
            )}
          </Button>
        </form>
      </Shell>
    );
  }

  // -------------------------------------------------------------------
  // Render: a payment exists
  // -------------------------------------------------------------------

  const currentView = view!;
  const meta = VIEW_META[currentView];
  const elapsed = elapsedSince(payment.createdAt, now);
  const pending = pendingCopy(currentView, payment);
  const canCancel = currentView === "qr" || currentView === "qr_missing";
  const showConnectionNotice = isPending && (!online || connectionIssue);
  const reviewText = payment.requiresReview ? payment.reviewReason : null;

  const header = (
    <>
      {offlinePill}
      <StatusPill label={meta.label} tone={meta.tone} pulse={meta.pulse} />
    </>
  );

  return (
    <Shell title="Payment" meta={`Order ${payment.orderRef}`} status={header}>
      <p className="sr-only" aria-live="polite">
        {announcement(currentView)}
      </p>

      {/* ---------------- Waiting with QR ---------------- */}
      {currentView === "qr" && payment.checkoutUrl && (
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-zinc-500">Amount due</p>
            <div className="mt-1">
              <AmountText size="xl" minor={payment.amountMinor} />
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-zinc-800 md:justify-start dark:text-zinc-200">
              <Loader2
                className="h-4 w-4 animate-spin text-sky-500"
                aria-hidden
              />
              Waiting for the customer to pay
            </p>
            {elapsed !== null && (
              <p className="mt-1 text-xs tabular-nums text-zinc-500">
                Open for {formatElapsed(elapsed)}
              </p>
            )}

            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-zinc-500 md:mx-0">
              Ask the customer to scan the code with their phone camera, check
              the order, and follow the steps on their screen.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-1 md:-ml-3 md:justify-start">
              <a
                href={payment.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open order page
              </a>
              <Button
                variant="ghost"
                size="sm"
                fullWidth={false}
                onClick={copyLink}
              >
                {copyState === "copied" ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden />
                )}
                {copyState === "copied"
                  ? "Link copied"
                  : copyState === "failed"
                    ? "Couldn't copy"
                    : "Copy link"}
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-68">
            {/* Always white: phone cameras read dark-on-light best. */}
            <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700">
              <QRCodeSVG
                value={payment.checkoutUrl}
                size={240}
                level="M"
                marginSize={0}
                role="img"
                aria-label={`QR code to pay ${formatMoney(payment.amountMinor)}`}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Pending without QR ---------------- */}
      {pending && (
        <div className="mx-auto max-w-md">
          <StateHero
            tone="warning"
            icon={
              currentView === "awaiting_confirm" ? (
                <Clock3 className="h-7 w-7" aria-hidden />
              ) : currentView === "qr_missing" ? (
                <QrCode className="h-7 w-7" aria-hidden />
              ) : (
                <AlertTriangle className="h-7 w-7" aria-hidden />
              )
            }
            title={pending.title}
          >
            {pending.body}
          </StateHero>

          <div className="mt-7">
            <DetailList
              items={[
                {
                  label: "Amount due",
                  value: formatMoney(payment.amountMinor),
                },
                currentView === "paid_partial" &&
                  payment.providerPaidMinor !== null && {
                    label: "Received",
                    value: formatMoney(payment.providerPaidMinor),
                  },
                { label: "Order", value: payment.orderRef },
                payment.createdAt
                  ? { label: "Started", value: formatClock(payment.createdAt) }
                  : null,
              ]}
            />
          </div>

          {pending.guidance && (
            <Notice tone="neutral" className="mt-4">
              {pending.guidance}
            </Notice>
          )}
          {reviewText && <TechnicalDetails text={reviewText} />}
        </div>
      )}

      {/* ---------------- Paid ---------------- */}
      {currentView === "paid" && (
        <div className="mx-auto max-w-md">
          <StateHero
            tone="success"
            celebrate
            icon={<Check className="h-8 w-8" strokeWidth={2.5} aria-hidden />}
            title={paidCopy(payment).title}
          >
            {paidCopy(payment).body}
          </StateHero>

          <div className="mt-7">
            <DetailList
              items={[
                { label: "Amount", value: formatMoney(payment.amountMinor) },
                { label: "Order", value: payment.orderRef },
                payment.paidAt
                  ? { label: "Paid at", value: formatClock(payment.paidAt) }
                  : null,
              ]}
            />
          </div>

          {reviewText && (
            <>
              <Notice
                tone="warning"
                icon={<AlertTriangle className="h-4 w-4" />}
                title="Check before handing over the goods"
                className="mt-4"
              >
                Confirm this payment in the payments dashboard first.
              </Notice>
              <TechnicalDetails text={reviewText} />
            </>
          )}
        </div>
      )}

      {/* ---------------- Not paid ---------------- */}
      {currentView === "closed" && (
        <div className="mx-auto max-w-md">
          <StateHero
            tone="danger"
            icon={<CircleX className="h-8 w-8" aria-hidden />}
            title={closedCopy(payment).title}
          >
            {closedCopy(payment).body}
          </StateHero>

          <div className="mt-7">
            <DetailList
              items={[
                { label: "Amount", value: formatMoney(payment.amountMinor) },
                { label: "Order", value: payment.orderRef },
              ]}
            />
          </div>

          {reviewText && <TechnicalDetails text={reviewText} />}
        </div>
      )}

      {/* ---------------- Notices ---------------- */}
      <div className="mx-auto mt-6 grid max-w-md gap-3 empty:hidden md:max-w-none">
        {showConnectionNotice && (
          <Notice
            tone="warning"
            icon={<WifiOff className="h-4 w-4" />}
            title={online ? "Connection problem" : "You're offline"}
          >
            The customer can still pay. This screen updates when the connection
            is back.
          </Notice>
        )}

        {syncWarning && currentView === "qr" && (
          <Notice tone="warning" icon={<AlertTriangle className="h-4 w-4" />}>
            This payment wasn&apos;t fully saved. The QR code works, but keep
            this screen open until the payment completes.
          </Notice>
        )}

        {pollPaused && isPending && (
          <Notice
            tone="neutral"
            icon={<Clock3 className="h-4 w-4" />}
            title="Stopped checking after 30 minutes"
            action={
              <Button
                variant="secondary"
                size="sm"
                fullWidth={false}
                onClick={() => setPollNonce((n) => n + 1)}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                Check again
              </Button>
            }
          />
        )}
      </div>

      {/* ---------------- Actions ---------------- */}
      <div className="mx-auto mt-8 grid max-w-md gap-3">
        {canCancel && cancelStep !== "idle" && (
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Cancel this payment?
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              The QR code stops working. If the customer has already started
              paying, wait for the result instead. A payment that arrives later
              is flagged for review.
            </p>
            {cancelError && (
              <Notice tone="danger" className="mt-3">
                {cancelError}
              </Notice>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                disabled={cancelStep === "working"}
                onClick={() => {
                  setCancelStep("idle");
                  setCancelError(null);
                }}
              >
                Keep waiting
              </Button>
              <Button
                variant="danger"
                loading={cancelStep === "working"}
                onClick={cancelPayment}
              >
                Cancel payment
              </Button>
            </div>
          </div>
        )}

        {canCancel && confirmLeave && cancelStep === "idle" && (
          <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Leave this payment open?
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              The customer can still finish it until it expires. If they pay,
              it&apos;s recorded in the payment records, but this screen
              won&apos;t show it.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmLeave(false)}
              >
                Stay here
              </Button>
              <Button onClick={startNewPayment}>Leave open</Button>
            </div>
          </div>
        )}

        {canCancel && cancelStep === "idle" && !confirmLeave && (
          <>
            <Button
              variant="secondary"
              onClick={() => setCancelStep("confirm")}
            >
              Cancel payment
            </Button>
            <Button variant="ghost" onClick={() => setConfirmLeave(true)}>
              Start another payment
            </Button>
          </>
        )}

        {!canCancel && (
          <Button size="lg" onClick={startNewPayment} autoFocus>
            <RotateCcw className="h-5 w-5" aria-hidden />
            New payment
          </Button>
        )}
      </div>
    </Shell>
  );
}
