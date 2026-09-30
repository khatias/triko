// =====================================================================
// Terminal configuration
// =====================================================================

/** Currency shown on every amount. The server fixes the real currency. */
export const CURRENCY = "SAR";

/** Number formatting locale (Latin digits, comma grouping). */
export const LOCALE = "en-US";

/** Limits in minor units (1.00 = 100). Kept in sync with create-saudi-payment. */
export const MIN_AMOUNT_MINOR = 100;
export const MAX_AMOUNT_MINOR = 1_000_000;

/** Longest whole part the input accepts, derived from the maximum. */
export const MAX_WHOLE_DIGITS = String(Math.floor(MAX_AMOUNT_MINOR / 100)).length;

// ---------------------------------------------------------------------
// Backend identifiers (internal, never shown to staff)
// ---------------------------------------------------------------------

export const PAYMENTS_TABLE = "saudi_payments";
export const CREATE_PAYMENT_FUNCTION = "create-saudi-payment";
export const CANCEL_PAYMENT_RPC = "cancel_saudi_payment";

/** Must match the reason written by cancel_saudi_payment(). */
export const STAFF_CANCEL_REASON = "Cancelled by staff";

/** Changing this key drops any payment that is open during a deploy. */
export const ACTIVE_PAYMENT_KEY = "triko:saudi-active-payment-id";

export const PAYMENT_COLUMNS =
  "id, public_ref, checkout_url, amount_halalas, currency, status, provider_state, provider_paid_halalas, failure_reason, requires_review, review_reason, created_at, paid_at";

/** Server error codes after which the client_request_id cannot be reused. */
export const SPENT_REQUEST_CODES: ReadonlySet<string> = new Set([
  "REQUEST_ID_REUSED",
  "CREATION_UNCERTAIN",
  "PROVIDER_REJECTED",
  "PROVIDER_UNAVAILABLE",
]);

// ---------------------------------------------------------------------
// Status polling
// ---------------------------------------------------------------------

export const POLL_FAST_MS = 2_000;
export const POLL_SLOW_MS = 5_000;
export const POLL_FAST_WINDOW_MS = 3 * 60_000;
export const POLL_GIVE_UP_MS = 30 * 60_000;
export const FAILURES_BEFORE_WARNING = 3;
export const COPY_FEEDBACK_MS = 2_000;
