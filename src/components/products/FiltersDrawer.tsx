"use client";

import React, { useState, useEffect } from "react";
import type { ShopGroup } from "@/lib/db/groups";
import Filter from "@/components/products/Filter";

export default function FiltersDrawer({ groups }: { groups: ShopGroup[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [open]);

  // Small delay for entrance animation
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-stone-800 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Filters
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            aria-label="Close"
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Drawer Panel */}
          <div 
            className={`relative w-full max-h-[90vh] bg-white rounded-t-3xl shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${mounted ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Drag Handle & Header */}
            <div className="flex-none pt-4 pb-2 px-6 flex flex-col items-center border-b border-stone-100">
              <div className="h-1.5 w-12 rounded-full bg-stone-200 mb-4" />
              <div className="w-full flex items-center justify-between pb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-800">Filters</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-2 -mr-2 text-stone-400 hover:text-stone-900 transition-colors bg-stone-50 hover:bg-stone-100 rounded-full"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-hidden relative">
              <div className="h-full overflow-y-auto px-6 pt-6">
                <Filter groups={groups} onClose={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}