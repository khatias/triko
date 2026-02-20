"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

function clampQuery(v: string) {
  return v.replace(/\s+/g, " ").trim().slice(0, 80);
}

function getLocaleFromPath(pathname: string) {
  const seg = pathname.split("/")[1] || "en";
  return seg;
}

export default function HeaderSearchToggle({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const localePrefix = useMemo(
    () => `/${getLocaleFromPath(pathname)}`,
    [pathname],
  );

  // Sync input with URL
  useEffect(() => {
    setValue(sp.get("q") ?? "");
  }, [sp]);

  // Desktop only: Focus when opening pill
  useEffect(() => {
    if (variant === "desktop" && open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(id);
    }
  }, [open, variant]);

  // Desktop only: Close on outside click
  useEffect(() => {
    if (variant === "mobile") return;
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, variant]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k" && variant === "desktop") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, variant]);

  function go(raw: string) {
    const q = clampQuery(raw);
    const next = new URLSearchParams(sp.toString());

    if (q) next.set("q", q);
    else next.delete("q");
    next.delete("page");

    router.push(`${localePrefix}/products?${next.toString()}`);

    if (variant === "desktop") setOpen(false);
    inputRef.current?.blur();
  }

  // =========================================
  // MOBILE VIEW: Premium Always-Open Bar
  // =========================================
  if (variant === "mobile") {
    return (
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className={[
          "flex items-center w-full h-11 rounded-xl px-3.5 gap-2.5 transition-all duration-300",
          "bg-neutral-100 border border-transparent",
          "focus-within:bg-white focus-within:border-rose-200 focus-within:ring-4 focus-within:ring-rose-600/10 focus-within:shadow-sm",
        ].join(" ")}
      >
        <Search
          className="h-4 w-4 text-neutral-400 shrink-0"
          strokeWidth={2.5}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search products..."
          className="flex-1 bg-transparent text-[15px] font-medium text-neutral-900 placeholder:text-neutral-400 outline-none w-full"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-500 hover:bg-neutral-300 hover:text-neutral-700 transition-colors outline-none"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" strokeWidth={3} />
          </button>
        )}
      </form>
    );
  }

  // =========================================
  // DESKTOP VIEW: Inline Expanding Pill
  // =========================================
  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className={[
        "hidden lg:flex items-center overflow-hidden rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] origin-right",
        open
          ? "w-70 bg-neutral-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-600 focus-within:shadow-sm"
          : "w-10 bg-transparent hover:bg-neutral-100/80 ring-0",
      ].join(" ")}
    >
      {/* Search Icon / Toggle Button */}
      <button
        type="button"
        aria-label="Search"
        onClick={() => {
          if (!open) setOpen(true);
          else if (value.trim()) go(value);
        }}
        className={[
          "flex shrink-0 items-center justify-center h-10 w-10 rounded-full transition-colors outline-none",
          open
            ? "text-neutral-500 hover:text-rose-600 cursor-pointer"
            : "text-neutral-600 hover:text-neutral-900",
        ].join(" ")}
      >
        <Search className="h-5 w-5" strokeWidth={open ? 2 : 1.5} />
      </button>

      {/* Input Field */}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        className={[
          "h-full bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400 outline-none transition-all duration-300",
          open
            ? "w-full opacity-100 pr-2"
            : "w-0 opacity-0 px-0 pointer-events-none",
        ].join(" ")}
        tabIndex={open ? 0 : -1}
      />

      {/* Close / Clear Button */}
      <div
        className={[
          "flex shrink-0 items-center justify-center transition-opacity duration-300",
          open ? "w-10 opacity-100" : "w-0 opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => {
            if (value) {
              setValue("");
              inputRef.current?.focus();
            } else {
              setOpen(false);
            }
          }}
          className="flex h-6.5 w-6.5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/80 hover:text-neutral-900 transition-colors outline-none"
          aria-label="Close search"
          tabIndex={open ? 0 : -1}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </form>
  );
}
