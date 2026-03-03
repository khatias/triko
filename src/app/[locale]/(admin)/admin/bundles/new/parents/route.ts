import { NextResponse } from "next/server";
import { searchParentOptions } from "../../_queries/parents";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ locale: string }> }) {
  const { locale } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const rows = await searchParentOptions(locale, q || "X");
  return NextResponse.json(rows);
}