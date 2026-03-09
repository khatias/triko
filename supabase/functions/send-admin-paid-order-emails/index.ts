import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type OutboxRow = {
  id: number;
  order_id: string;
  recipient: string;
};

// Define the shape of our order items for better TypeScript support
type OrderItem = {
  quantity: number;
  name_en?: string;
  name_ka?: string;
  unit_price: number;
  line_total: number;
  variant_name?: string;
  parent_code?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

function money(n: number | string | null) {
  if (n === null || n === undefined) return "0.00";
  const x = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

// Helper to format date nicely
function formatDate(dateString: string | null) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return new Intl.DateTimeFormat("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

serve(async (req) => {
  try {
    // simple protection
    const got = req.headers.get("x-cron-secret") || "";
    if (!CRON_SECRET || got !== CRON_SECRET) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch a small batch to avoid timeouts
    const { data: outbox, error: outErr } = await supabase
      .from("admin_email_outbox")
      .select("id, order_id, recipient")
      .is("sent_at", null)
      .lt("attempts", 10)
      .order("created_at", { ascending: true })
      .limit(20);

    if (outErr) throw outErr;

    const rows = (outbox || []) as OutboxRow[];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200 });
    }

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        // Pull order
        const { data: orderRows, error: oErr } = await supabase
          .from("orders")
          .select(
            "id,status,total,currency,order_code,paid_at,shipping_full_name,shipping_phone,shipping_line1,shipping_line2,shipping_city,shipping_region,shipping_zone,village_name,shipping_amount"
          )
          .eq("id", row.order_id)
          .limit(1);

        if (oErr) throw oErr;
        const order = orderRows?.[0];
        if (!order || order.status !== "paid") {
          // If order isn't paid anymore or missing, just mark as error and continue
          await supabase.from("admin_email_outbox").update({
            attempts: supabase.rpc ? undefined : undefined, // no-op
          });
          await supabase
            .from("admin_email_outbox")
            .update({ attempts: 999, last_error: "Order missing or not paid" })
            .eq("id", row.id);
          failed++;
          continue;
        }

        // Pull items
        const { data: items, error: iErr } = await supabase
          .from("order_items")
          .select("quantity,name_en,name_ka,unit_price,line_total,variant_name,parent_code")
          .eq("order_id", row.order_id)
          .order("created_at", { ascending: true });

        if (iErr) throw iErr;

        // Subject in Georgian
        const subject = `TRIKO: ახალი შეკვეთა${order.order_code ? " #" + order.order_code : ""}`;

        // Prioritize Georgian name, then English
        const itemsHtml = (items as OrderItem[] || [])
          .map((it) => {
            const name = it.name_ka || it.name_en || it.parent_code || "პროდუქტი";
            const variant = it.variant_name ? `<br><small style="color: #7f8c8d; font-size: 12px;">(${it.variant_name})</small>` : "";
            return `
              <tr>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                  <strong style="color: #2c3e50;">${name}</strong>${variant}
                </td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #555;">${it.quantity}</td>
                <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #2c3e50;">${money(it.line_total)} ${order.currency}</td>
              </tr>
            `;
          })
          .join("");

        const address = [
          order.shipping_line1,
          order.shipping_line2,
          order.shipping_city,
          order.shipping_region,
          order.village_name,
        ]
          .filter(Boolean)
          .join(", ");

        // Beautiful Georgian HTML Email Template
        const html = `
          <!DOCTYPE html>
          <html lang="ka">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ახალი შეკვეთა</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              
              <div style="text-align: center; border-bottom: 2px solid #f0f2f5; padding-bottom: 20px; margin-bottom: 25px;">
                <h2 style="margin: 0; color: #2c3e50; font-size: 24px;">ახალი  შეკვეთა</h2>
                <div style="display: inline-block; background: #10b981; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin-top: 12px; font-size: 14px; letter-spacing: 0.5px;">
                  # ${order.order_code || order.id}
                </div>
              </div>

              <div style="margin-bottom: 30px;">
                <h3 style="color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; margin-bottom: 15px; margin-top: 0;">მიტანის დეტალები</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280; width: 40%;">მომხმარებელი:</td>
                    <td style="padding: 6px 0; font-weight: 500;">${order.shipping_full_name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280;">ტელეფონი:</td>
                    <td style="padding: 6px 0; font-weight: 500;">
                      <a href="tel:${order.shipping_phone}" style="color: #3b82f6; text-decoration: none;">${order.shipping_phone}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280;">მისამართი:</td>
                    <td style="padding: 6px 0; font-weight: 500;">${address}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280;">მიტანის ზონა:</td>
                    <td style="padding: 6px 0; font-weight: 500;">${order.shipping_zone || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6b7280;">გადახდის დრო:</td>
                    <td style="padding: 6px 0; font-weight: 500;">${formatDate(order.paid_at)}</td>
                  </tr>
                </table>
              </div>

              <div>
                <h3 style="color: #3b82f6; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; margin-bottom: 15px; margin-top: 0;">პროდუქტები</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
                  <thead>
                    <tr>
                      <th style="text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #64748b; border-top-left-radius: 6px;">დასახელება</th>
                      <th style="text-align: center; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #64748b;">რაოდენობა</th>
                      <th style="text-align: right; background: #f8fafc; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #64748b; border-top-right-radius: 6px;">ფასი</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml || `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #999;">(პროდუქტები არ არის)</td></tr>`}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="text-align: left; padding: 15px 10px 5px 10px; color: #6b7280;">მიტანის ღირებულება:</td>
                      <td style="text-align: right; padding: 15px 10px 5px 10px; font-weight: 500;">${money(order.shipping_amount)} ${order.currency}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="text-align: left; padding: 10px; font-size: 18px; font-weight: bold; color: #1e293b;">ჯამური ღირებულება:</td>
                      <td style="text-align: right; padding: 10px; font-size: 18px; font-weight: bold; color: #10b981;">${money(order.total)} ${order.currency}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #9ca3af;">
                ეს შეტყობინება ავტომატურად არის გენერირებული TRIKO-ს სისტემის მიერ.
              </div>

            </div>
          </body>
          </html>
        `;

        // Send via Resend
        const resendResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Triko <orders@triko.ge>",
            to: row.recipient,
            subject,
            html,
          }),
        });

        const resendJson = await resendResp.json();
        if (!resendResp.ok) {
          throw new Error(`Resend error: ${JSON.stringify(resendJson)}`);
        }

        await supabase
          .from("admin_email_outbox")
          .update({ sent_at: new Date().toISOString(), attempts: 0, last_error: null, resend_id: resendJson?.id ?? null })
          .eq("id", row.id);

        sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase
          .from("admin_email_outbox")
          .update({ attempts: supabase.rpc ? undefined : undefined })
          .eq("id", row.id);

        // increment attempts
        const { data: curr } = await supabase
          .from("admin_email_outbox")
          .select("attempts")
          .eq("id", row.id)
          .limit(1);

        const attempts = (curr?.[0]?.attempts ?? 0) + 1;

        await supabase
          .from("admin_email_outbox")
          .update({ attempts, last_error: msg })
          .eq("id", row.id);

        failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: rows.length, sent, failed }), { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
});