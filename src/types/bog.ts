export type BogTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type BogBasketItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  description?: string;
};
export type BogLink = { href: string };
export type BogCreateOrderResponse = {
  id: string;
  _links: {
    details: BogLink;
    redirect: BogLink;
  };
};
export type BogCreateOrderApiResponse =
  | BogCreateOrderApiOk
  | BogCreateOrderApiError;

export type BogCreateOrderApiOk = {
  ok: true;
  bogOrderId: string;
  redirectUrl: string;
  detailsUrl: string;
  raw?: BogCreateOrderResponse;
};

export type BogCreateOrderApiError = {
  ok: false;
  message?: string;
  error?: unknown;
};

export type BogLanguage = "ka" | "en";

export type BogBuyer = {
  full_name?: string;
  masked_email?: string;
  masked_phone?: string;
};

export type BogPurchaseUnits = {
  basket: BogBasketItem[];
  total_amount: number;
  currency?: BogCurrency;
};

export type BogRedirectUrls = {
  success?: string;
  fail?: string;
};

export type BogCurrency = "GEL" | "USD" | "EUR" | "GBP" ;
export type BogCreateOrderPayload = {
  callback_url: string;
  external_order_id?: string;
  purchase_units: BogPurchaseUnits;
  redirect_urls?: BogRedirectUrls;
  payment_method: ["card"];
  buyer?: BogBuyer;
  ttl?: number;
};

// export type BogTheme = "light" | "dark";

// export type BogPaymentMethod = "card";
