import type { ActionResult } from "@/lib/cart/actions";

type CartT = (
  key: "errors.onlyLeft" | "errors.notEnoughStock" | "errors.generic",
  values?: Record<string, string | number>,
) => string;

export function CartError(res: ActionResult, t: CartT): string | null {
  if (res.ok) return null;
  if (res.kind !== "stock") return res.message || t("errors.generic");

  const match = /available\s+([0-9]+(?:\.[0-9]+)?)/i.exec(res.message);
  const available = match?.[1];

  return available
    ? t("errors.onlyLeft", { available: Number(available) })
    : t("errors.notEnoughStock");
}
