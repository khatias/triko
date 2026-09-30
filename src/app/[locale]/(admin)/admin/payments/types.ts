export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

export type Payment = {
  id: string;
  orderRef: string;
  checkoutUrl: string | null;
  amountMinor: number;
  status: PaymentStatus;
  providerState: string | null;
  providerPaidMinor: number | null;
  failureReason: string | null;
  requiresReview: boolean;
  reviewReason: string | null;
  createdAt: string | null;
  paidAt: string | null;
};

/** What the terminal shows for a payment. Derived with viewFor(). */
export type View =
  | "qr"
  | "qr_missing"
  | "awaiting_confirm"
  | "paid_partial"
  | "paid_more"
  | "flagged"
  | "paid"
  | "closed";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export type KeypadKey =
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "."
  | "backspace";

export type InvokeFailure = { message: string; keepRequestId: boolean };

export type CancelStep = "idle" | "confirm" | "working";

export type CopyState = "idle" | "copied" | "failed";