import React from "react";
import { Link } from "@/i18n/routing";
export const Section = ({
  children,
  className = "",
  labelledBy,
  id,
}: React.PropsWithChildren<{
  className?: string;
  labelledBy?: string;
  id?: string;
}>) => (
  <section
    {...(id ? { id } : {})}
    {...(labelledBy ? { "aria-labelledby": labelledBy } : {})}
    className={`container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 ${className}`}
  >
    {children}
  </section>
);

export const RegularCard = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={`rounded-3xl border border-rose-100 bg-white/80 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur ${className}`}
  >
    {children}
  </div>
);

export const H2 = ({
  children,
  id,
}: React.PropsWithChildren<{ id?: string }>) => (
  <h2
    id={id}
    className="min-w-0 wrap-break-word text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900 leading-snug"
  >
    {children}
  </h2>
);

export const P = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <p
    className={`text-base leading-7 text-gray-700 whitespace-normal wrap-break-word ${className}`}
  >
    {children}
  </p>
);

export const linkCls = [
  "relative inline-block text-sm text-zinc-700/90",
  "transition-colors hover:text-zinc-900 focus:text-zinc-900",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdd5a2]/50 rounded",
  // underline animation
  "after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[1.5px]",
  "after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-200",
  "hover:after:scale-x-100 focus:after:scale-x-100",
].join(" ");

export const headCls = [
  "text-[12px] font-semibold tracking-[0.18em] text-zinc-900/90",
  "uppercase select-none",
].join(" ");
export const formHeading = [
  "relative mx-auto mb-6 max-w-2xl text-center text-3xl sm:text-4xl font-semibold leading-[1.15] tracking-wide text-zinc-900 [text-wrap:balance] selection:bg-[#fdd5a2]/30 before:content-[''] before:absolute before:inset-x-1/3 before:-bottom-1 before:h-6 before:rounded-full before:bg-[#fdd5a2]/20 before:blur-xl before:-z-10 after:content-[''] after:mt-4 after:block after:h-[3px] after:w-16 sm:after:w-24 after:rounded-full after:mx-auto after:bg-gradient-to-r after:from-[#fdd5a2] after:via-rose-300/70 after:to-[#fdd5a2]",
].join(" ");
export const linkBase =
  "px-1.5 py-1 text-[14px] font-medium tracking-[0.08em] text-slate-700 rounded-md hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200";

export const wrap =
  "container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32";
export function MenuButton({
  onClick,
  icon: Icon,
  children,
  danger,
}: {
  onClick?: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="menuitem"
      className={[
        "w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        danger
          ? "text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 dark:active:bg-red-500/20"
          : "text-slate-700 hover:text-slate-900 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800/70 dark:active:bg-slate-800",
      ].join(" ")}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function Separator() {
  return (
    <div className="my-1 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
  );
}
export function MenuItem({
  href,
  onClick,
  icon: Icon,
  children,
}: {
  href: string;
  onClick?: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className={[
        "flex items-center gap-3 px-4 py-2.5 text-sm",
        "text-slate-700 hover:text-slate-900",
        "hover:bg-slate-50 active:bg-slate-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
        "dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800/70 dark:active:bg-slate-800",
        "transition-colors",
      ].join(" ")}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span className="truncate">{children}</span>
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "subtle-danger";
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition duration-200 ease-in-out whitespace-nowrap";
  const styles =
    variant === "primary"
      ? "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-400"
      : variant === "outline"
        ? "border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 focus:ring-orange-300"
        : "border border-transparent text-red-600 bg-white hover:bg-red-50 focus:ring-red-300";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({
  id,
  name,
  label,
  required,
  defaultValue,
  placeholder,  
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition duration-150"
      />
    </div>
  );
}
