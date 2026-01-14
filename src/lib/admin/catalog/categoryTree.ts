import type { CategoryRow } from "@/types/catalog";

type CatNode = CategoryRow & { children: CatNode[] };

export function buildCategoryTreeFlat(
  categories: CategoryRow[]
): CategoryRow[] {
  const byId = new Map<string, CatNode>();

  for (const c of categories) {
    byId.set(c.id, { ...c, children: [] });
  }

  const roots: CatNode[] = [];

  for (const c of categories) {
    const node = byId.get(c.id);
    if (!node) continue;

    if (c.parent_id) {
      const parent = byId.get(c.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CatNode[]) => {
    nodes.sort((a, b) => {
      const pa = a.position ?? 10_000;
      const pb = b.position ?? 10_000;
      if (pa !== pb) return pa - pb;

      const na = (a.name_en ?? a.name_ka ?? "").toLowerCase();
      const nb = (b.name_en ?? b.name_ka ?? "").toLowerCase();
      return na.localeCompare(nb);
    });

    for (const n of nodes) sortNodes(n.children);
  };

  sortNodes(roots);

  const out: CategoryRow[] = [];
  const visiting = new Set<string>();

  const walk = (node: CatNode, depth: number) => {
    if (visiting.has(node.id)) return;
    visiting.add(node.id);

    const prefix = depth > 0 ? "— ".repeat(depth) : "";

    out.push({
      id: node.id,
      parent_id: node.parent_id,
      position: node.position,
      status: node.status,
      name_en: node.name_en ? `${prefix}${node.name_en}` : null,
      name_ka: node.name_ka ? `${prefix}${node.name_ka}` : null,
    });

    for (const ch of node.children) walk(ch, depth + 1);

    visiting.delete(node.id);
  };

  for (const r of roots) walk(r, 0);

  return out;
}
