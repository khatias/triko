"use client";
import * as React from "react";
import { createPortal } from "react-dom";

type Option = { value: string; label: string };
type Props = {
  name: string;
  label?: string;
  placeholder?: string;
  options: Option[];
  defaultValue?: string;
  className?: string;
};

export default function CustomSelect({
  name,
  label,
  placeholder = "—",
  options,
  defaultValue = "",
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);
  const [hover, setHover] = React.useState<number>(() => {
    const i = options.findIndex(o => o.value === defaultValue);
    return i >= 0 ? i : -1;
  });

  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number; maxH: number }>({
    top: 0, left: 0, width: 0, maxH: 256,
  });

  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? (value ? value : placeholder);
  const listboxId = `${name}-listbox`;

  // Measure & position (flip if needed)
  const measure = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vwH = window.innerHeight;
    const below = Math.max(0, vwH - r.bottom - 8);
    const above = Math.max(0, r.top - 8);
    const openDown = below >= Math.min(256, below, above) || below >= 160;
    const top = window.scrollY + (openDown ? r.bottom + 6 : r.top - 6);
    const maxH = openDown ? below : above;
    setPos({ top, left: window.scrollX + r.left, width: r.width, maxH: Math.max(160, Math.min(256, maxH)) });
  }, []);

  // Avoid paint flicker the moment it opens
  React.useLayoutEffect(() => {
    if (open) measure();
  }, [open, measure]);

  // Scroll/resize listeners (passive + rAF throttle)
  React.useEffect(() => {
    if (!open) return;
    let ticking = false;
    const onMove = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        measure();
        ticking = false;
      });
    };
    const onClickAway = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove, { passive: true });
    window.addEventListener("click", onClickAway);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("click", onClickAway);
    };
  }, [open, measure]);

  // Keyboard controls on the button & list
  const move = (dir: 1 | -1) => {
    const len = options.length;
    if (!len) return;
    const start = hover >= 0 ? hover : options.findIndex(o => o.value === value);
    const next = ((start + dir + len) % len + len) % len;
    setHover(next);
    listRef.current?.querySelectorAll<HTMLElement>("li")[next]?.scrollIntoView({ block: "nearest" });
  };

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    setValue(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  return (
    <div className="relative">
      {label && (
        <label
          className="mb-1 block text-sm text-slate-600"
          onClick={() => btnRef.current?.focus()}
          id={`${name}-label`}
        >
          {label}
        </label>
      )}

      <input type="hidden" name={name} value={value} />

      <button
        ref={btnRef}
        type="button"
        className={`flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-3 text-left
                    focus:outline-none focus:ring-1 focus:ring-[#fdd5a2] focus:border-[#fdd5a2] ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={label ? `${name}-label` : undefined}
        onClick={() => setOpen(o => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); if (!open) setOpen(true); move(1); }
          else if (e.key === "ArrowUp") { e.preventDefault(); if (!open) setOpen(true); move(-1); }
          else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!open) setOpen(true); else if (hover >= 0) commit(hover); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>{displayLabel}</span>
        <svg className="ml-2 h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open && createPortal(
        <ul
          id={listboxId}
          role="listbox"
          ref={listRef}
          tabIndex={-1}
          aria-activedescendant={hover >= 0 ? `${name}-opt-${hover}` : undefined}
          className="z-[10000] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, maxHeight: pos.maxH }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
            else if (e.key === "Enter") { e.preventDefault(); if (hover >= 0) commit(hover); }
            else if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
          }}
        >
          {options.map((opt, i) => {
            const isSelected = value === opt.value;
            const isActive = hover === i;
            return (
              <li
                id={`${name}-opt-${i}`}
                key={opt.value || `opt-${i}`}
                role="option"
                aria-selected={isSelected}
                className={`flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-slate-700
                  ${isActive ? "bg-orange-50" : ""}`}
                onMouseEnter={() => setHover(i)}
                onMouseDown={(e) => e.preventDefault()} // keep focus
                onClick={() => commit(i)}
              >
                <span className="mr-2 inline-block h-4 w-4" aria-hidden="true">
                  {isSelected ? "✓" : ""}
                </span>
                <span>{opt.label}</span>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}
