"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
import { handleLogout } from "@/utils/auth/handleLogOut";

type MenuPos = {
  top: number;
  left: number;
  width: number;
};

export default function AccountMenu({ user }: { user: SafeUser }) {
  const t = useTranslations("Header");

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0, width: 256 });

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const fullName = (user?.full_name || "").trim();
  const firstName = useMemo(
    () => (fullName ? fullName.split(/\s+/)[0] : ""),
    [fullName],
  );

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => btnRef.current?.focus());
  }, []);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => setMounted(true), []);

  const computePos = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const r = btn.getBoundingClientRect();
    const menuWidth = 256; // w-64
    const gap = 8; // mt-2

    // Align right edge to button right edge, but keep within viewport.
    const viewportW = window.innerWidth;
    const minLeft = 8;
    const maxLeft = Math.max(minLeft, viewportW - menuWidth - 8);

    const desiredLeft = r.right - menuWidth;
    const left = Math.min(Math.max(desiredLeft, minLeft), maxLeft);

    const top = r.bottom + gap;

    setPos({ top, left, width: menuWidth });
  }, []);

  // When opening, position immediately
  useLayoutEffect(() => {
    if (!open) return;
    computePos();
  }, [open, computePos]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;

    const onScroll = () => computePos();
    const onResize = () => computePos();

    // capture scroll from any scroll container
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, computePos]);

  // Escape to close
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const menuPortal =
    mounted && open
      ? createPortal(
          <>
            {/* Backdrop: topmost shield */}
            <div
              className="fixed inset-0 z-999 bg-transparent"
              aria-hidden="true"
              onPointerDown={(e) => {
                // Close and block click-through
                e.preventDefault();
                e.stopPropagation();
                close();
              }}
            />

            {/* Menu container */}
            <div
              className="fixed z-1000"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              role="menu"
              aria-label="Account menu"
              ref={menuRef}
              onPointerDown={(e) => {
                // Stop interactions inside menu from bubbling to backdrop
                e.stopPropagation();
              }}
            >
              <div
                className={[
                  "rounded-2xl overflow-hidden",
                  "bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80",
                  "ring-1 ring-slate-900/10 shadow-2xl",
                  "dark:bg-slate-900/80 dark:ring-white/10",
                  "transition transform ease-out duration-150",
                  "opacity-100 scale-100",
                ].join(" ")}
              >
                {/* Greeting / Header */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-200/70 dark:border-white/10">
                  <div
                    className="grid place-items-center h-9 w-9 rounded-full
                      bg-linear-to-br from-rose-50 to-rose-100 ring-1 ring-rose-200/60
                    "
                  >
                    <UserIcon className="h-5 w-5 text-rose-500 dark:text-rose-300" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm">
                      <span className="text-slate-500 dark:text-slate-300">
                        {user
                          ? t("greeting", { name: firstName || user.email })
                          : ""}
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
                        href="/profile/account"
                        onClick={close}
                        icon={UserCircleIcon}
                      >
                        {t("account")}
                      </MenuItem>

                      <MenuItem
                        href="/profile/orders"
                        onClick={close}
                        icon={ShoppingBagIcon}
                      >
                        {t("orders")}
                      </MenuItem>

                      <MenuItem
                        href="/profile/addresses"
                        onClick={close}
                        icon={UserCircleIcon}
                      >
                        {t("addresses")}
                      </MenuItem>

                      <Separator />

                      <MenuButton
                        onClick={() => {
                          handleLogout();
                          close();
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
                        onClick={close}
                        icon={ArrowRightIcon}
                      >
                        {t("login")}
                      </MenuItem>

                      <MenuItem
                        href="/signup"
                        onClick={close}
                        icon={ArrowRightIcon}
                      >
                        {t("signup")}
                      </MenuItem>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          ref={btnRef}
          aria-label={user ? "Open account menu" : "Sign In"}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
          className={[
            "group inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5",
            "bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/70",
            "ring-1 ring-slate-900/5 shadow-sm hover:shadow transition",
            "hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
            "dark:bg-slate-900/70 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-slate-900",
          ].join(" ")}
        >
          <span
            className="relative grid place-items-center rounded-full h-8 w-8
              bg-linear-to-br from-rose-50 to-rose-100 text-rose-700
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
      </div>

      {menuPortal}
    </>
  );
}
