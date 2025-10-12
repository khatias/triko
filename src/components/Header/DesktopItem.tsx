import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { linkBase } from "../UI/primitives";
import type { NavItem } from "@/types/Category";
export function DesktopItem({ item }: { item: NavItem }) {
  const hasChildren = !!item.children?.length;

  if (!hasChildren) {
    return (
      <li className="relative">
        <Link href={item.href} className={linkBase}>
          {item.name}
        </Link>
      </li>
    );
  }

  return (
    <li className="group relative ">
      <div className="flex items-center gap-1">
        <Link href={item.href} className={linkBase}>
          {item.name}
        </Link>
        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-hover:rotate-180" />
      </div>

      {/* Flyout */}
      <div className="invisible absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
        <Link
          href={item.href}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-rose-700/90 hover:bg-rose-50 hover:text-rose-700"
        >
          {item.name}
        </Link>
        <div className="my-1 h-px bg-slate-200" />
        <ul className="max-h-[60vh] overflow-auto py-1">
          {item.children!.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
