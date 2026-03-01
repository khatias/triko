import axios from "axios";
import { createClient } from "@supabase/supabase-js";

/* ---------------- env helpers ---------------- */

function mustEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing env ${name}`);
  return String(v).trim();
}

function envNum(name, fallback) {
  const raw = process.env[name];
  const n = raw == null || String(raw).trim() === "" ? fallback : Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Env ${name} must be a number`);
  return n;
}

function nowIso() {
  return new Date().toISOString();
}

function shortErr(x, max = 1200) {
  const s = typeof x === "string" ? x : JSON.stringify(x);
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/* ---------------- config ---------------- */

const SUPABASE_URL = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

// Realtime is optional. If you don’t set ANON key, realtime will be skipped.
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim()
  : "";

const FINA_BASE_URL = mustEnv("FINA_BASE_URL").replace(/\/+$/, "");
const FINA_LOGIN = mustEnv("FINA_LOGIN");
const FINA_PASSWORD = mustEnv("FINA_PASSWORD");

const FINA_STORE_ID = envNum("FINA_STORE_ID", 11);
const FINA_USER_ID = envNum("FINA_USER_ID", 1);
const FINA_DEFAULT_CUSTOMER_ID = envNum("FINA_DEFAULT_CUSTOMER_ID", 194);

const OUTBOX_BATCH_LIMIT = envNum("FINA_OUTBOX_BATCH_LIMIT", 10);
const OUTBOX_MAX_ATTEMPTS = envNum("FINA_OUTBOX_MAX_ATTEMPTS", 10);
const STUCK_SENDING_MINUTES = envNum("FINA_OUTBOX_STUCK_MINUTES", 5);

const OUTBOX_POLL_MS = envNum("FINA_OUTBOX_POLL_MS", 30_000);
const CATALOG_SYNC_MS = envNum("FINA_CATALOG_SYNC_MS", 5 * 60_000);

const FINA_SALES_ENABLED =
  (process.env.FINA_SALES_ENABLED ?? "true").toLowerCase() === "true";

/* ---------------- clients ---------------- */

// 1) DB Admin client (service role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// 2) Realtime client (anon key) — optional
const supabaseRealtime = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

/* ---------------- Fina auth (token cached in memory) ---------------- */

let cachedToken = "";
let cachedTokenExpMs = 0;

function base64UrlDecode(input) {
  const pad = "=".repeat((4 - (input.length % 4)) % 4);
  const b64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf8");
}

function jwtExpMs(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return 0;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const exp = typeof payload?.exp === "number" ? payload.exp : 0;
    return exp > 0 ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

async function finaAuthToken() {
  // refresh if expiring within 10 minutes
  const refreshThreshold = 10 * 60_000;

  if (cachedToken && cachedTokenExpMs - Date.now() > refreshThreshold) {
    return cachedToken;
  }

  const authRes = await axios.post(
    `${FINA_BASE_URL}/api/authentication/authenticate`,
    { login: FINA_LOGIN, password: FINA_PASSWORD },
    { timeout: 20_000 }
  );

  const token = authRes?.data?.token;
  const ex = authRes?.data?.ex ?? null;

  if (ex) throw new Error(`FINA auth ex: ${String(ex)}`);
  if (!token) throw new Error("FINA auth failed: no token");

  cachedToken = String(token);
  cachedTokenExpMs = jwtExpMs(cachedToken) || Date.now() + 35 * 60 * 60_000;

  return cachedToken;
}

async function finaApi() {
  const token = await finaAuthToken();
  return axios.create({
    baseURL: FINA_BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 25_000,
  });
}

/* ---------------- utilities ---------------- */

function toNumberStrict(v, name) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  throw new Error(`Invalid number for ${name}`);
}

/* ---------------- outbox processor ---------------- */

let isProcessingOutbox = false;

async function recoverStuckSending() {
  const cutoff = new Date(Date.now() - STUCK_SENDING_MINUTES * 60_000).toISOString();
  const { error } = await supabaseAdmin
    .from("fina_outbox")
    .update({ status: "pending" })
    .eq("status", "sending")
    .lt("last_attempt_at", cutoff);

  if (error) console.error("[OUTBOX] recoverStuckSending error:", error.message ?? error);
}

async function processOutbox() {
  if (!FINA_SALES_ENABLED) return;
  if (isProcessingOutbox) return;
  isProcessingOutbox = true;

  try {
    await recoverStuckSending();

    const { data: tasks, error: fetchErr } = await supabaseAdmin
      .from("fina_outbox")
      .select("id, order_id, attempts")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(OUTBOX_BATCH_LIMIT);

    if (fetchErr) throw fetchErr;
    if (!tasks || tasks.length === 0) return;

    console.log(`\n[OUTBOX] Found ${tasks.length} pending orders. Syncing to Fina...`);

    const api = await finaApi();

    for (const task of tasks) {
      // atomic lock: pending -> sending
      const { data: lockRow, error: lockErr } = await supabaseAdmin
        .from("fina_outbox")
        .update({ status: "sending", last_attempt_at: nowIso() })
        .eq("id", task.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (lockErr || !lockRow) continue;

      try {
        // load order
        const { data: ord, error: ordErr } = await supabaseAdmin
          .from("orders")
          .select("id, currency, total, paid_at, fina_doc_id")
          .eq("id", task.order_id)
          .single();

        if (ordErr) throw ordErr;
        if (!ord) throw new Error("Order not found");
        if (!ord.paid_at) throw new Error("Order not paid yet");

        // idempotency
        if (ord.fina_doc_id) {
          await supabaseAdmin
            .from("fina_outbox")
            .update({ status: "sent", last_error: null })
            .eq("id", task.id);
          continue;
        }

        // load items
        const { data: items, error: itemsErr } = await supabaseAdmin
          .from("order_items")
          .select("fina_id, quantity, unit_price, product_name")
          .eq("order_id", task.order_id);

        if (itemsErr) throw itemsErr;
        if (!items || items.length === 0) throw new Error("No order_items found");
        for (const it of items) if (!it.fina_id) throw new Error("Missing fina_id in order_items");

        const products = items.map((it) => ({
          id: it.fina_id,
          sub_id: 0,
          quantity: it.quantity,
          price: toNumberStrict(it.unit_price, "unit_price"),
        }));

        const finaDate = new Date(ord.paid_at).toISOString().split(".")[0];

        const salePayload = {
          id: 0,
          date: finaDate,
          num_pfx: "TRIKO",
          num: 0,
          purpose: `Triko order ${task.order_id}`,
          amount: toNumberStrict(ord.total, "order.total"),
          currency: ord.currency || "GEL",
          rate: 1.0,
          store: FINA_STORE_ID,
          user: FINA_USER_ID,
          staff: 0,
          project: 0,
          customer: FINA_DEFAULT_CUSTOMER_ID,
          is_vat: true,
          make_entry: true,
          pay_type: 1,
          price_type: 3,
          w_type: 3,
          t_type: 1,
          t_payer: 1, // ✅ FIX: 1 = Buyer pays transport
          w_cost: 0,
          foreign: false,
          drv_name: "",
          tr_start: "",
          tr_end: "",
          driver_id: "",
          car_num: "",
          tr_text: "",
          sender: "",
          reciever: "",
          comment: "Website Online Sale",
          overlap_type: 0,
          overlap_amount: 0,
          add_fields: [],
          products,
          services: [],
        };

        const resp = await api.post("/api/operation/saveDocProductOut", salePayload);
        const finaId = resp?.data?.id;
        const ex = resp?.data?.ex ?? null;

        if (ex) throw new Error(`FINA saveDocProductOut ex: ${String(ex)}`);
        if (!finaId) throw new Error(`FINA returned no id: ${JSON.stringify(resp?.data)}`);

        await supabaseAdmin
          .from("orders")
          .update({ fina_doc_id: finaId, fina_synced_at: nowIso(), fina_sync_error: null })
          .eq("id", task.order_id);

        await supabaseAdmin
          .from("fina_outbox")
          .update({ status: "sent", last_error: null })
          .eq("id", task.id);

        console.log(` [OUTBOX] Synced order=${task.order_id} (Fina ID: ${finaId})`);
      } catch (err) {
        const msg = err?.response?.data ? shortErr(err.response.data) : shortErr(err?.message ?? err);
        const attempts = (task.attempts || 0) + 1;

        await supabaseAdmin
          .from("fina_outbox")
          .update({
            status: attempts >= OUTBOX_MAX_ATTEMPTS ? "failed" : "pending",
            attempts,
            last_error: msg,
          })
          .eq("id", task.id);

        await supabaseAdmin
          .from("orders")
          .update({ fina_sync_error: msg })
          .eq("id", task.order_id);

        console.error(` [OUTBOX] Failed order=${task.order_id}. Error: ${msg}`);
      }
    }
  } catch (err) {
    const msg = err?.response?.data ? shortErr(err.response.data) : shortErr(err?.message ?? err);
    console.error("[OUTBOX] Global processor error:", msg);
  } finally {
    isProcessingOutbox = false;
  }
}

/* ---------------- realtime listener (optional) ---------------- */

function startRealtimeListener() {
  if (!supabaseRealtime) {
    console.log(" Realtime disabled (missing NEXT_PUBLIC_SUPABASE_ANON_KEY). Using polling only.");
    return;
  }

  supabaseRealtime
    .channel("outbox-listener")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "fina_outbox" },
      () => {
        console.log(" [REALTIME] New outbox row inserted. Triggering instant sync...");
        processOutbox().catch(() => {});
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") console.log(" Listening for outbox inserts...");
      if (status === "CHANNEL_ERROR") console.log(" Realtime channel error. Polling will still work.");
      if (status === "TIMED_OUT") console.log(" Realtime timed out. Polling will still work.");
    });
}

/* ---------------- catalog sync (Fina -> Supabase) ---------------- */

async function syncFinaCatalogOnce() {
  try {
    console.log(`\n[${nowIso()}] --- Starting Master Sync ---`);

    // backstop: always attempt outbox
    await processOutbox();

    const api = await finaApi();

    // Products
    const productsRes = await api.get("/api/operation/getProducts");
    const products = productsRes?.data?.products ?? [];
    if (Array.isArray(products) && products.length > 0) {
      const formattedProducts = products.map((p) => ({
        fina_id: p.id,
        group_id: p.group_id ?? null,
        code: p.code ?? null,
        name: p.name ?? null,
        vat: p.vat ?? null,
        unit_id: p.unit_id ?? null,
        raw: p,
      }));
      // ✅ FIX: Throw on error to prevent silent DB failures
      await supabaseAdmin.from("fina_products").upsert(formattedProducts, { onConflict: "fina_id" }).throwOnError();
    }

    // Prices
    const pricesRes = await api.get("/api/operation/getProductPrices");
    const prices = pricesRes?.data?.prices ?? [];
    if (Array.isArray(prices) && prices.length > 0) {
      const formattedPrices = prices.map((p) => ({
        fina_id: p.product_id,
        price_id: p.price_id,
        price: p.price,
        discount_price: p.discount_price,
        currency: p.currency,
      }));
      // ✅ FIX: Throw on error
      await supabaseAdmin.from("fina_prices").upsert(formattedPrices, { onConflict: "fina_id,price_id" }).throwOnError();
    }

    // Stock (full refresh)
    const stockRes = await api.get("/api/operation/getProductsRest");
    const stock = stockRes?.data?.rest ?? [];
    if (Array.isArray(stock) && stock.length > 0) {
      const formattedStock = stock.map((s) => ({
        fina_id: s.id,
        store_id: s.store,
        rest: String(s.rest),
        updated_at: nowIso(),
      }));
      // ✅ FIX: Throw on error
      await supabaseAdmin.from("fina_stock").upsert(formattedStock, { onConflict: "store_id,fina_id" }).throwOnError();
    }

    console.log(" Sync Cycle Complete.");
  } catch (error) {
    const msg = error?.response?.data ? shortErr(error.response.data) : shortErr(error?.message ?? error);
    console.error(" Sync Failed:", msg);
  }
}

/* ---------------- scheduler ---------------- */

function startPollingFallback() {
  setInterval(() => {
    processOutbox().catch(() => {});
  }, OUTBOX_POLL_MS);

  console.log(` Outbox polling every ${Math.round(OUTBOX_POLL_MS / 1000)}s`);
}

function startMasterLoop() {
  const loop = async () => {
    await syncFinaCatalogOnce();
    setTimeout(loop, CATALOG_SYNC_MS);
  };
  loop().catch(() => {});
  console.log(` Master sync every ${Math.round(CATALOG_SYNC_MS / 60000)} minutes`);
}

/* ---------------- start ---------------- */

console.log("[WORKER] starting", {
  FINA_BASE_URL,
  FINA_STORE_ID,
  FINA_USER_ID,
  FINA_DEFAULT_CUSTOMER_ID,
  FINA_SALES_ENABLED,
});

startRealtimeListener();
startPollingFallback();
startMasterLoop();