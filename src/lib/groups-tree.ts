type GroupRow = {
  group_id: number;
  parent_group_id: number | null;
};

export function collectDescendantGroupIds(
  all: GroupRow[],
  rootId: number,
): number[] {
  const byParent = new Map<number, number[]>();

  for (const g of all) {
    if (g.parent_group_id == null) continue;
    const arr = byParent.get(g.parent_group_id) ?? [];
    arr.push(g.group_id);
    byParent.set(g.parent_group_id, arr);
  }

  const out: number[] = [];
  const seen = new Set<number>();
  const stack: number[] = [rootId];

  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);

    out.push(id);

    const kids = byParent.get(id) ?? [];
    for (const k of kids) stack.push(k);
  }

  return out;
}
