import { STAFF_CANCEL_REASON } from "./config";
import type { Payment, Tone, View } from "./types";
import { formatMoney } from "./utils";

// =====================================================================
// Everything staff read. No provider or country names on purpose.
// =====================================================================

export const VIEW_META: Record<View, { label: string; tone: Tone; pulse?: boolean }> = {
  qr: { label: "Waiting for payment", tone: "info", pulse: true },
  qr_missing: { label: "Open", tone: "warning" },
  awaiting_confirm: { label: "Confirming", tone: "warning", pulse: true },
  paid_partial: { label: "Needs review", tone: "warning" },
  paid_more: { label: "Needs review", tone: "warning" },
  flagged: { label: "Needs review", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  closed: { label: "Not paid", tone: "danger" },
};

export function announcement(view: View): string {
  switch (view) {
    case "qr":
      return "Waiting for the customer to pay.";
    case "qr_missing":
      return "Payment open. The QR code can't be shown.";
    case "awaiting_confirm":
      return "Payment is being confirmed.";
    case "paid":
      return "Payment received.";
    case "closed":
      return "Payment not completed.";
    default:
      return "Payment needs review.";
  }
}

type Copy = { title: string; body: string; guidance?: string };

const MOVE_ON =
  "You can start the next sale. This payment stays on record and updates on its own.";

/** Copy for pending payments that aren't showing a QR code. */
export function pendingCopy(view: View, p: Payment): Copy | null {
  switch (view) {
    case "qr_missing":
      return {
        title: "QR code can't be shown",
        body: "This payment is open, but its QR code didn't load. If the customer already scanned it, wait for the result. Otherwise cancel it and create a new one.",
      };
    case "awaiting_confirm":
      return {
        title: "Confirming payment",
        body: "The customer's bank is still confirming this payment. Don't hand over the goods yet.",
        guidance: MOVE_ON,
      };
    case "paid_partial":
      return {
        title: "Only part was paid",
        body: `Received ${
          p.providerPaidMinor !== null ? formatMoney(p.providerPaidMinor) : "an unknown amount"
        } of ${formatMoney(p.amountMinor)}. Don't hand over the goods.`,
        guidance: MOVE_ON,
      };
    case "paid_more":
      return {
        title: "Customer paid too much",
        body: "More than the requested amount was paid. Check it in the payments dashboard before completing the sale.",
        guidance: MOVE_ON,
      };
    case "flagged":
      return {
        title: "Needs review",
        body: "An update arrived that doesn't match this sale. Check it in the payments dashboard before handing over the goods.",
        guidance: MOVE_ON,
      };
    default:
      return null;
  }
}

export function paidCopy(p: Payment): Copy {
  return p.requiresReview
    ? {
        title: "Payment received",
        body: "The money arrived, but something about it needs a check. Confirm in the payments dashboard before handing over the goods.",
      }
    : { title: "Payment received", body: "You can hand over the goods." };
}

export function closedCopy(p: Payment): Copy {
  if (p.status === "cancelled" && p.failureReason === STAFF_CANCEL_REASON) {
    return { title: "Payment cancelled", body: "You cancelled this payment. No money was taken." };
  }
  if (p.status === "cancelled") {
    return {
      title: "Customer cancelled",
      body: "The customer cancelled on their phone. Don't hand over the goods.",
    };
  }
  if (p.status === "expired") {
    return {
      title: "Payment expired",
      body: "The customer didn't pay in time. Create a new payment to try again.",
    };
  }
  switch (p.providerState) {
    case "rejected":
      return {
        title: "Payment declined",
        body: "The card or wallet was declined. The customer can try another one.",
      };
    case "blocked":
      return {
        title: "Payment blocked",
        body: "This payment was blocked for security reasons. Don't hand over the goods.",
      };
    default:
      return {
        title: "Payment failed",
        body: "No money was taken. Don't hand over the goods. Create a new payment to try again.",
      };
  }
}