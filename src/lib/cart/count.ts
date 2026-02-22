export function computeCartBadgeCount(
  items: Array<{ qty: number; bundle_key?: string | null }>,
): number {
  let singles = 0;

  // bundle_key -> qty (take max)
  const bundleQty = new Map<string, number>();

  for (const it of items) {
    const q = Number(it.qty ?? 0);
    if (!Number.isFinite(q) || q <= 0) continue;

    const k = (it.bundle_key ?? "").trim();
    if (!k) {
      singles += q;
      continue;
    }

    const prev = bundleQty.get(k) ?? 0;
    if (q > prev) bundleQty.set(k, q);
  }

  let bundles = 0;
  for (const q of bundleQty.values()) bundles += q;

  return singles + bundles;
}