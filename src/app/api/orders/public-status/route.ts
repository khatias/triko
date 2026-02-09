// src/app/api/orders/public-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mustProcessEnv } from "@/utils/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrdersStatus = "pending_payment" | "paid" | "failed" | "cancelled";

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function isOrdersStatus(v: unknown): v is OrdersStatus {
  return v === "pending_payment" || v === "paid" || v === "failed" || v === "cancelled";
}

function getAdmin() {
  return createClient(
    mustProcessEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustProcessEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  const tokenRaw = req.nextUrl.searchParams.get("token");
  const token = tokenRaw?.trim() ?? "";

  if (!token || !isUuid(token)) {
    return NextResponse.json({ ok: false, message: "Invalid token" }, { status: 400 });
  }

  const supabase = getAdmin();

  const { data, error } = await supabase
    .from("orders")
    .select("status")
    .eq("public_status_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  const status = (data as { status: unknown }).status;
  if (!isOrdersStatus(status)) {
    return NextResponse.json({ ok: true, status: "pending_payment" }, { status: 200 });
  }

  return NextResponse.json(
    { ok: true, status },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
