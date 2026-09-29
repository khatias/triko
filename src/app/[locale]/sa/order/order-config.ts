// =====================================================================
// Customer order page: everything a customer reads that TRIKO may
// want to change. Confirm these before the exhibition.
// =====================================================================

export const BRAND_NAME = "TRIKO";
export const LEGAL_NAME = "Triko 1 LLC";
export const CONTACT_EMAIL = "info@triko.ge";

/** Exchange policy page linked on the order and the receipt. */
export const EXCHANGE_POLICY_URL = "https://triko.ge/en/exchange-policy";

/** Order and receipt times are shown in exhibition time. */
export const DISPLAY_TIME_ZONE = "Asia/Riyadh";

export const CURRENCY_LABEL = "SAR";

export const METHOD_LABELS: Record<string, string> = {
  mada_sa: "mada",
  applepay_sa: "Apple Pay",
  stcpay_sa: "STC Pay",
  card_sa: "Card",
  payssion_test: "Test payment",
};

/** How often the page re-checks the order while waiting. */
export const POLL_WHILE_PAYING_MS = 3_000;
export const POLL_WHILE_OPEN_MS = 10_000;
export const POLL_GIVE_UP_MS = 10 * 60_000;