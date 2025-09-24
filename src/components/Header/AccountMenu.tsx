"use client";
import React, { useRef, useState, useEffect } from "react";
import { useTranslations } from "use-intl";
import type { SafeUser } from "@/types/auth";
import {
  UserIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  UserCircleIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { Separator, MenuButton, MenuItem } from "../UI/primitives";

export default function AccountMenu({ user }: { user: SafeUser }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fullName = (user?.full_name || "").trim();
  const firstName = fullName ? fullName.split(/\s+/)[0] : "";

  // Single effect: outside click + Escape
  useEffect(() => {
    if (!open) return;

    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    // capture phase improves reliability
    document.addEventListener("mousedown", onDocClick, true);
    document.addEventListener("touchstart", onDocClick, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onDocClick, true);
      document.removeEventListener("touchstart", onDocClick, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLinkClick = () => setOpen(false);
  const t = useTranslations("Header");

  return (
    <div className="relative">
      <button
        type="button"
        ref={btnRef}
        aria-label={user ? "Open account menu" : "Sign In"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          "group inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5",
          "bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
          "ring-1 ring-slate-900/5 shadow-sm hover:shadow transition",
          "hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
          "dark:bg-slate-900/70 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-900",
        ].join(" ")}
      >
        <span
          className="relative grid place-items-center rounded-full h-8 w-8
            bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700
            ring-1 ring-rose-200/60 group-hover:from-rose-100 group-hover:to-rose-200
            dark:from-rose-900/30 dark:to-rose-800/30 dark:text-rose-200 dark:ring-rose-900/40"
        >
          <UserIcon className="h-5 w-5 text-rose-500" />
        </span>
        <span className="sr-only lg:not-sr-only text-sm font-medium text-slate-700 dark:text-slate-100">
          {user ? firstName || user.email : t("login")}
        </span>
        <ChevronDownIcon
          className={[
            "h-4 w-4 transition-transform duration-200",
            open ? "rotate-180 text-rose-600" : "rotate-0 text-slate-500",
            "group-hover:text-rose-700 dark:text-slate-300",
          ].join(" ")}
        />
      </button>

      {/* Dropdown */}
      <div
        ref={menuRef}
        className={[
          "absolute right-0 mt-2 w-64 z-50 origin-top-right",
          "transition transform ease-out duration-150",
          open
            ? "opacity-100 scale-100"
            : "pointer-events-none opacity-0 scale-95",
        ].join(" ")}
        role="menu"
        aria-label="Account menu"
      >
        <div
          className={[
            "rounded-2xl overflow-hidden",
            "bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80",
            "ring-1 ring-slate-900/10 shadow-2xl",
            "dark:bg-slate-900/80 dark:ring-white/10",
          ].join(" ")}
        >
          {/* Greeting / Header */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-200/70 dark:border-white/10">
            <div
              className="grid place-items-center h-9 w-9 rounded-full
                bg-gradient-to-br from-rose-50 to-rose-100 ring-1 ring-rose-200/60
                dark:from-rose-900/30 dark:to-rose-800/30 dark:ring-rose-900/40"
            >
              <UserIcon className="h-5 w-5 text-rose-500 dark:text-rose-300" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm">
                <span className="text-slate-500 dark:text-slate-300">
                  {user ? t("greeting", { name: firstName || user.email }) : ""}
                </span>{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user ? firstName || user.email : t("joinUs")}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="py-1">
            {user ? (
              <>
                <MenuItem
                  href="/profile"
                  onClick={handleLinkClick}
                  icon={UserCircleIcon}
                >
                  {t("profile")}
                </MenuItem>
                <MenuItem
                  href="/orders"
                  onClick={handleLinkClick}
                  icon={ShoppingBagIcon}
                >
                  {t("orders")}
                </MenuItem>

                <Separator />

                <MenuButton
                  onClick={() => {
                    /* add signOut here */
                  }}
                  danger
                  icon={ArrowRightIcon}
                >
                  {t("logout")}
                </MenuButton>
              </>
            ) : (
              <>
                <MenuItem
                  href="/login"
                  onClick={handleLinkClick}
                  icon={ArrowRightIcon}
                >
                  {t("login")}
                </MenuItem>
                <MenuItem
                  href="/signup"
                  onClick={handleLinkClick}
                  icon={ArrowRightIcon}
                >
                  {t("signup")}
                </MenuItem>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
