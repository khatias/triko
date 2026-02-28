import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FINA_BASE_URL = process.env.FINA_BASE_URL;
const FINA_LOGIN = process.env.FINA_LOGIN;
const FINA_PASSWORD = process.env.FINA_PASSWORD;

async function syncFinaData() {
  try {
    console.log(`\n[${new Date().toISOString()}] --- Starting Master Sync ---`);

    console.log("Step 1: Authenticating with Fina...");
    const authRes = await axios.post(`${FINA_BASE_URL}/api/authentication/authenticate`, {
      login: FINA_LOGIN,
      password: FINA_PASSWORD
    });
    const token = authRes.data.token;
    if (!token) throw new Error("Authentication failed, no token received.");
    console.log("✅ Success! Fina accepted the credentials.");

    const api = axios.create({
      baseURL: FINA_BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: 30000
    });

    console.log("Step 2: Fetching Products from Fina...");
    const productsRes = await api.get('/api/operation/getProducts');
    const products = productsRes.data.products || [];
    if (products.length > 0) {
      console.log(`Found ${products.length} products. Upserting to Supabase...`);
      const formattedProducts = products.map(p => ({
        fina_id: p.id,
        group_id: p.group_id,
        code: p.code,
        name: p.name,
        vat: p.vat,
        unit_id: p.unit_id
      }));
      await supabase.from('fina_products').upsert(formattedProducts, { onConflict: 'fina_id' });
    }

    console.log("Step 3: Fetching Prices from Fina...");
    const pricesRes = await api.get('/api/operation/getProductPrices');
    const prices = pricesRes.data.prices || [];
    if (prices.length > 0) {
      console.log(`Found ${prices.length} prices. Upserting to Supabase...`);
      const formattedPrices = prices.map(p => ({
        product_id: p.product_id,
        price_id: p.price_id,
        price: p.price,
        discount_price: p.discount_price,
        currency: p.currency
      }));
      await supabase.from('fina_prices').upsert(formattedPrices, { onConflict: 'product_id,price_id' });
    }

    console.log("Step 4: Fetching Stock from Fina...");
    const stockRes = await api.get('/api/operation/getProductsRest');
    const stock = stockRes.data.rest || [];
    if (stock.length > 0) {
      console.log(`Found ${stock.length} stock records. Upserting to Supabase...`);
      const formattedStock = stock.map(s => ({
        product_id: s.id,
        store_id: s.store,
        rest: s.rest,
        reserve: s.reserve
      }));
      await supabase.from('fina_stock').upsert(formattedStock, { onConflict: 'product_id,store_id' });
    }

    // Step 5 removed: The database triggers we created earlier will handle the Materialized View 
    // refresh automatically, but ONLY if actual price/stock changes occur during the upserts.

    console.log("✅ Sync Cycle Complete. Sleeping for 5 minutes...");

  } catch (error) {
    console.error("❌ Sync Failed:", error?.response?.data || error.message);
  }

  setTimeout(syncFinaData, 5 * 60 * 1000);
}

syncFinaData();