"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  Clock3,
  Download,
  Loader2,
  PackageCheck,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { supabase } from "@/utils/supabase/clients";

import {
  BRAND_NAME,
  CONTACT_EMAIL,
  CURRENCY_LABEL,
  DISPLAY_TIME_ZONE,
  EXCHANGE_POLICY_URL,
  LEGAL_NAME,
  METHOD_LABELS,
  POLL_GIVE_UP_MS,
  POLL_WHILE_OPEN_MS,
  POLL_WHILE_PAYING_MS,
} from "../../order-config";

// =====================================================================
// Types and parsing
// =====================================================================

type Order = {
  ref: string;
  amountHalalas: number;
  description: string | null;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  processing: boolean;
  method: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  receivedAt: string | null;
};

type Load =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "error" }
  | { kind: "ready"; order: Order };

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function toOrder(data: unknown): Order | null | "not_found" {
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.found === false) return "not_found";

  const amount =
    typeof d.amount_halalas === "number"
      ? d.amount_halalas
      : typeof d.amount_halalas === "string" && /^\d+$/.test(d.amount_halalas)
        ? Number(d.amount_halalas)
        : null;

  if (d.found !== true || typeof d.ref !== "string" || amount === null)
    return null;

  const status =
    d.status === "paid" ||
    d.status === "failed" ||
    d.status === "cancelled" ||
    d.status === "expired"
      ? d.status
      : "pending";

  return {
    ref: d.ref,
    amountHalalas: amount,
    description: str(d.description),
    status,
    processing: d.processing === true,
    method: str(d.method),
    createdAt: str(d.created_at),
    expiresAt: str(d.expires_at),
    confirmedAt: str(d.confirmed_at),
    paidAt: str(d.paid_at),
    receivedAt: str(d.received_at),
  };
}

// =====================================================================
// Formatting
// =====================================================================

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

function money(halalas: number): string {
  return moneyFormatter.format(halalas / 100);
}

function when(iso: string | null, timeOnly = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return (timeOnly ? timeFormatter : dateTimeFormatter).format(d);
}

function methodLabel(pm: string | null): string | null {
  if (!pm) return null;
  return METHOD_LABELS[pm] ?? (/card|visa|master/i.test(pm) ? "Card" : null);
}

function countdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function cx(...c: Array<string | false | null | undefined>): string {
  return c.filter(Boolean).join(" ");
}

// =====================================================================
// Page
// =====================================================================

export default function CustomerOrder({
  orderRef,
  token,
}: {
  orderRef: string;
  token: string;
}) {
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [busy, setBusy] = useState<null | "pay" | "received">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pollStopped, setPollStopped] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const requestRef = useRef(0);
  const pollStartRef = useRef(Date.now());

  const fetchOrder = useCallback(async () => {
    const requestId = ++requestRef.current;
    try {
      const { data, error } = await supabase.rpc("get_saudi_order", {
        p_ref: orderRef,
        p_token: token,
      });
      if (requestId !== requestRef.current) return;
      if (error) throw error;

      const parsed = toOrder(data);
      if (parsed === "not_found") setLoad({ kind: "not_found" });
      else if (parsed === null)
        setLoad((cur) => (cur.kind === "ready" ? cur : { kind: "error" }));
      else setLoad({ kind: "ready", order: parsed });
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error("Order load error:", err);
      // Keep showing the last good state on a failed refresh.
      setLoad((cur) => (cur.kind === "ready" ? cur : { kind: "error" }));
    }
  }, [orderRef, token]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const order = load.kind === "ready" ? load.order : null;
  const waitingForPayment =
    order?.status === "pending" &&
    (order.confirmedAt !== null || order.processing);
  const awaitingConfirm = order?.status === "pending" && !waitingForPayment;

  // Poll while the order can still change.
  useEffect(() => {
    if (!order || order.status !== "pending" || pollStopped) return;

    const interval = waitingForPayment
      ? POLL_WHILE_PAYING_MS
      : POLL_WHILE_OPEN_MS;
    const timer = window.setInterval(() => {
      if (Date.now() - pollStartRef.current > POLL_GIVE_UP_MS) {
        setPollStopped(true);
        return;
      }
      if (document.visibilityState === "visible") void fetchOrder();
    }, interval);

    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchOrder();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible); // back button from the payment page

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, [order, waitingForPayment, pollStopped, fetchOrder]);

  // Countdown while the order waits for the customer's confirmation.
  useEffect(() => {
    if (!awaitingConfirm || !order?.expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [awaitingConfirm, order?.expiresAt]);

  const expiresInMs = order?.expiresAt
    ? Date.parse(order.expiresAt) - now
    : null;

  useEffect(() => {
    if (awaitingConfirm && expiresInMs !== null && expiresInMs <= 0)
      void fetchOrder();
  }, [awaitingConfirm, expiresInMs, fetchOrder]);

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  async function placeOrder() {
    if (busy) return;
    setBusy("pay");
    setActionError(null);

    try {
      const { data, error } = await supabase.rpc("confirm_saudi_order", {
        p_ref: orderRef,
        p_token: token,
        p_user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;

      const result = (data as Record<string, unknown> | null)?.result;
      const url = (data as Record<string, unknown> | null)?.url;

      if (
        result === "redirect" &&
        typeof url === "string" &&
        url.startsWith("https://")
      ) {
        window.location.assign(url);
        return; // keep the button busy while the browser leaves
      }

      if (result === "unavailable") {
        setActionError(
          "Payment isn't available for this order. Please ask the staff for a new QR code.",
        );
      }
      pollStartRef.current = Date.now();
      setPollStopped(false);
      await fetchOrder();
    } catch (err) {
      console.error("Place order error:", err);
      setActionError("Couldn't continue. Check your connection and try again.");
    }
    setBusy(null);
  }

  async function confirmReceived() {
    if (busy) return;
    setBusy("received");
    setActionError(null);

    try {
      const { data, error } = await supabase.rpc(
        "confirm_saudi_order_received",
        {
          p_ref: orderRef,
          p_token: token,
          p_user_agent:
            typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
      );
      if (error) throw error;
      if ((data as Record<string, unknown> | null)?.result !== "received") {
        setActionError("This order isn't paid yet.");
      }
      await fetchOrder();
    } catch (err) {
      console.error("Confirm received error:", err);
      setActionError(
        "Couldn't save that. Check your connection and try again.",
      );
    }
    setBusy(null);
  }

  function checkAgain() {
    pollStartRef.current = Date.now();
    setPollStopped(false);
    void fetchOrder();
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <main className="min-h-dvh bg-stone-100 px-4 py-8 text-zinc-900 print:bg-white print:py-0">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 flex items-center justify-between print:mb-4">
          <span className="text-xl font-semibold tracking-[0.2em]">
            {BRAND_NAME}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 print:hidden">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Secure order
          </span>
        </header>

        {load.kind === "loading" && <LoadingCard />}

        {load.kind === "not_found" && (
          <MessageCard
            tone="neutral"
            icon={<AlertCircle className="h-6 w-6" aria-hidden />}
            title="Order not found"
            body="This link isn't valid. Please scan the latest QR code at the TRIKO stand."
          />
        )}

        {load.kind === "error" && (
          <MessageCard
            tone="neutral"
            icon={<AlertCircle className="h-6 w-6" aria-hidden />}
            title="Couldn't load your order"
            body="Check your internet connection and try again."
            action={
              <PrimaryButton onClick={() => void fetchOrder()}>
                Try again
              </PrimaryButton>
            }
          />
        )}

        {order && (
          <>
            {/* ---------------- Place the order ---------------- */}
            {awaitingConfirm && (
              <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200">
                <div className="px-6 pb-6 pt-7">
                  <p className="text-sm text-zinc-500">Your order</p>
                  <p className="mt-0.5 font-mono text-sm text-zinc-700">
                    {order.ref}
                  </p>

                  <div className="mt-6 rounded-2xl bg-stone-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Items
                    </p>
                    <p className="mt-1 text-[15px] leading-6">
                      {order.description ??
                        "In-person purchase at the TRIKO stand"}
                    </p>
                  </div>

                  <div className="mt-6 flex items-baseline justify-between">
                    <span className="text-sm text-zinc-500">Total</span>
                    <span className="text-4xl font-semibold tabular-nums tracking-tight">
                      {money(order.amountHalalas)}
                      <span className="ml-1.5 text-lg font-medium text-zinc-400">
                        {CURRENCY_LABEL}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 px-6 py-5">
                  {actionError && <InlineError>{actionError}</InlineError>}

                  <PrimaryButton
                    onClick={() => void placeOrder()}
                    loading={busy === "pay"}
                    large
                  >
                    Place order and pay
                  </PrimaryButton>

                  <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
                    Pay with mada, Apple Pay, STC Pay or card on the next page.
                  </p>

                  {expiresInMs !== null && expiresInMs > 0 && (
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden />
                      Reserved for{" "}
                      <span className="tabular-nums font-medium text-zinc-700">
                        {countdown(expiresInMs)}
                      </span>
                    </p>
                  )}
                </div>

                <p className="bg-stone-50 px-6 py-4 text-xs leading-5 text-zinc-500">
                  By placing this order you agree to buy the items above from{" "}
                  {LEGAL_NAME}. <ExchangePolicy />
                </p>
              </section>
            )}

            {/* ---------------- Payment in progress ---------------- */}
            {waitingForPayment && (
              <MessageCard
                tone="info"
                icon={
                  <Loader2
                    className="h-6 w-6 motion-safe:animate-spin"
                    aria-hidden
                  />
                }
                title={
                  order.processing
                    ? "Your bank is confirming the payment"
                    : "Confirming your payment"
                }
                body={
                  pollStopped
                    ? "This is taking longer than usual. If you finished paying, show this page to the staff."
                    : "This usually takes a few seconds. Please keep this page open."
                }
                action={
                  <div className="grid gap-2">
                    {pollStopped && (
                      <PrimaryButton onClick={checkAgain}>
                        Check again
                      </PrimaryButton>
                    )}
                    {!order.processing && (
                      <SecondaryButton
                        onClick={() => void placeOrder()}
                        loading={busy === "pay"}
                      >
                        I haven&apos;t paid yet, go to payment
                      </SecondaryButton>
                    )}
                    {actionError && <InlineError>{actionError}</InlineError>}
                  </div>
                }
                footer={`${order.ref}, ${money(order.amountHalalas)} ${CURRENCY_LABEL}`}
              />
            )}

            {/* ---------------- Receipt ---------------- */}
            {order.status === "paid" && (
              <Receipt
                order={order}
                busy={busy === "received"}
                error={actionError}
                onReceived={() => void confirmReceived()}
              />
            )}

            {/* ---------------- Closed ---------------- */}
            {(order.status === "cancelled" ||
              order.status === "expired" ||
              order.status === "failed") && (
              <MessageCard
                tone="danger"
                icon={<XCircle className="h-6 w-6" aria-hidden />}
                title={
                  order.status === "expired"
                    ? "This order has expired"
                    : order.status === "cancelled"
                      ? "This order was cancelled"
                      : "The payment didn't go through"
                }
                body={
                  order.status === "failed"
                    ? "No money was taken. Please ask the staff at the TRIKO stand for a new QR code to try again."
                    : "No payment can be made for it. Please ask the staff at the TRIKO stand for a new QR code."
                }
                footer={`${order.ref}, ${money(order.amountHalalas)} ${CURRENCY_LABEL}`}
              />
            )}
          </>
        )}

        <footer className="mt-8 text-center text-xs leading-5 text-zinc-400 print:mt-4">
          {LEGAL_NAME}, {CONTACT_EMAIL}
        </footer>
      </div>
    </main>
  );
}

// =====================================================================
// Receipt
// =====================================================================

function Receipt({
  order,
  busy,
  error,
  onReceived,
}: {
  order: Order;
  busy: boolean;
  error: string | null;
  onReceived: () => void;
}) {
  const method = methodLabel(order.method);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200 print:shadow-none">
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Payment received
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Thank you for shopping with {BRAND_NAME}.
          </p>

          <p className="mt-6 text-4xl font-semibold tabular-nums tracking-tight">
            {money(order.amountHalalas)}
            <span className="ml-1.5 text-lg font-medium text-zinc-400">
              {CURRENCY_LABEL}
            </span>
          </p>
        </div>

        {/* Perforation */}
        <div className="relative h-4" aria-hidden>
          <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-zinc-300" />
          <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-stone-100 print:hidden" />
          <div className="absolute -right-2 top-0 h-4 w-4 rounded-full bg-stone-100 print:hidden" />
        </div>

        <dl className="space-y-3 px-6 py-5 text-sm">
          <Row label="Receipt">{order.ref}</Row>
          {order.paidAt && <Row label="Paid">{when(order.paidAt)}</Row>}
          {method && <Row label="Method">{method}</Row>}
          <Row label="Items">{order.description ?? "In-person purchase"}</Row>
          <Row label="Seller">{LEGAL_NAME}</Row>
          {order.receivedAt && (
            <Row label="Received">{when(order.receivedAt)}</Row>
          )}
        </dl>

        <p className="bg-stone-50 px-6 py-4 text-xs leading-5 text-zinc-500">
          <ExchangePolicy />
        </p>
      </section>

      <div className="print:hidden">
        {order.receivedAt ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <PackageCheck className="h-5 w-5" aria-hidden />
            You confirmed you received your items at{" "}
            {when(order.receivedAt, true)}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <p className="text-sm font-medium">Got your bag?</p>
            <p className="mt-1 text-sm text-zinc-500">
              Tap when the staff hand you your items.
            </p>
            {error && <InlineError>{error}</InlineError>}
            <div className="mt-4">
              <PrimaryButton onClick={onReceived} loading={busy} large>
                <PackageCheck className="h-5 w-5" aria-hidden />I received my
                items
              </PrimaryButton>
            </div>
          </div>
        )}

        <div className="mt-4">
          <SecondaryButton onClick={() => window.print()}>
            <Download className="h-4 w-4" aria-hidden />
            Save receipt
          </SecondaryButton>
          <p className="mt-2 text-center text-xs text-zinc-400">
            You can also come back to this page anytime from the same link.
          </p>
        </div>
      </div>
    </div>
  );
}

/** "For returns and exchanges, visit triko.ge/en/exchange-policy." The
    address is the link text, so it also reads on a saved or printed receipt. */
function ExchangePolicy() {
  const shown = EXCHANGE_POLICY_URL.replace(/^https?:\/\//, "");
  return (
    <>
      For returns and exchanges, visit{" "}
      <a
        href={EXCHANGE_POLICY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900 print:no-underline"
      >
        {shown}
      </a>
      .
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-right font-medium">{children}</dd>
    </div>
  );
}

// =====================================================================
// Small pieces
// =====================================================================

const TONES = {
  neutral: "bg-zinc-100 text-zinc-600",
  info: "bg-sky-50 text-sky-600",
  danger: "bg-red-50 text-red-600",
} as const;

function MessageCard({
  tone,
  icon,
  title,
  body,
  action,
  footer,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  footer?: string;
}) {
  return (
    <section
      className="rounded-3xl bg-white px-6 py-8 text-center shadow-sm ring-1 ring-zinc-200"
      aria-live="polite"
    >
      <div
        className={cx(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
          TONES[tone],
        )}
      >
        {icon}
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500">
        {body}
      </p>
      {action && <div className="mt-6">{action}</div>}
      {footer && (
        <p className="mt-6 font-mono text-xs text-zinc-400">{footer}</p>
      )}
    </section>
  );
}

function LoadingCard() {
  return (
    <section
      className="rounded-3xl bg-white px-6 py-8 shadow-sm ring-1 ring-zinc-200"
      aria-label="Loading your order"
    >
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded bg-zinc-100" />
      <div className="mt-8 h-16 animate-pulse rounded-2xl bg-zinc-100" />
      <div className="mt-8 h-14 animate-pulse rounded-2xl bg-zinc-100" />
    </section>
  );
}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {children}
    </p>
  );
}

function PrimaryButton({
  children,
  onClick,
  loading = false,
  large = false,
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cx(
        "flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/20 active:scale-[0.99] disabled:opacity-60",
        large ? "h-14 text-base" : "h-12 text-sm",
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  loading = false,
}: {
  children: ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-semibold text-zinc-900 ring-1 ring-zinc-300 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10 disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
