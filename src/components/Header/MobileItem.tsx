import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { NavItem } from "@/types/Category";
export function MobileItem({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children?.length;

  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-100 hover:text-rose-600"
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div className="px-1">
      <button
        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-100 hover:text-rose-600"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-controls={`sect-${item.id}`}
      >
        <span>{item.name}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={`sect-${item.id}`}
        className={`${open ? "block" : "hidden"} pb-1 pl-3`}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-rose-700/90 hover:bg-rose-50 hover:text-rose-700"
        >
          {item.name}
        </Link>
        <ul className="mt-1 space-y-1">
          {item.children!.map((c) => (
            <li key={c.id}>
              <Link
                href={c.href}
                onClick={onNavigate}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
