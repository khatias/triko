"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/helpers";

type Props = {
  value: string;
  className?: string;
  mono?: boolean;
  showIcon?: boolean;
  title?: string;
};

export function CopyText({
  value,
  className,
  mono = true,
  showIcon = true,
  title = "Copy",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={!value}
      title={title}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <span className={cn("select-all break-all", mono && "font-mono")}>
        {value}
      </span>
      {showIcon ? (
        copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-zinc-400" />
        )
      ) : null}
    </button>
  );
}
