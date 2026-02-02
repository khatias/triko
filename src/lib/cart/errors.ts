import type { ActionResult } from "@/lib/cart/actions";

export function CartError(res: ActionResult): string | null {
  if (res.ok) return null;

  if (res.kind !== "stock") return res.message;

  // Parse available from: "not enough stock. requested X, available Y"
  const match = /available\s+([0-9]+(?:\.[0-9]+)?)/i.exec(res.message);
  const available = match?.[1] ?? null;

  if (available) return `Only ${available} left in stock.`;
  return "Not enough stock available.";
}
