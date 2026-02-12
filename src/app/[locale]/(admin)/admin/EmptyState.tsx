"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex min-h-100 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center animate-in fade-in-50",
        "dark:border-zinc-800 dark:bg-zinc-900/20",
        className,
      )}
    >
      {/* Icon Wrapper */}
      {icon && (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 shadow-sm ring-8 ring-zinc-50 dark:bg-zinc-800 dark:ring-zinc-900">
          <div className="text-zinc-500 dark:text-zinc-400">{icon}</div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6 max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8">
        {action ? (
          action
        ) : actionLabel && actionHref ? (
          <Link
            href={actionHref}
            className={cn(
              "inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2",
              "dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
            )}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
