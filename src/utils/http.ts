import { NextResponse } from "next/server";

export type ApiOk<T extends string> = {
  ok: true;
  code: T;
  message: string;
  email?: string;
};

export type ApiErr<T extends string> = {
  ok: false;
  code: T;
  message: string;
  field?: "email" | "password" | "unknown";
};

export type ApiResp<OK extends string, ERR extends string> =
  | ApiOk<OK>
  | ApiErr<ERR>;

export function json(res: object, status: number) {
  return NextResponse.json(res, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function safeJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
