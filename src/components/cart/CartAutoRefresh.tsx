"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  intervalMs?: number; // default 15000
};

export default function CartAutoRefresh({ intervalMs = 15000 }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => startTransition(() => router.refresh());

    // 1) refresh when user returns to the tab
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };

    // 2) refresh on window focus
    const onFocus = () => refresh();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);

    // 3) periodic refresh (so stock changes show up)
    const id = window.setInterval(refresh, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [router, intervalMs]);

  return null;
}
