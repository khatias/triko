"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "./ui";

/** Terminal / Records switcher. Works wherever the payments route is mounted. */
export default function PaymentsNav() {
  const pathname = usePathname() ?? "";
  const onRecords = /\/records\/?$/.test(pathname);
  const base = pathname.replace(/\/records\/?$/, "").replace(/\/$/, "");

  const items = [
    { href: base || "/", label: "Terminal", active: !onRecords },
    { href: `${base}/records`, label: "Records", active: onRecords },
  ];

  return (
    <nav aria-label="Payments" className="inline-flex rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cx(
            "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400",
            item.active
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}