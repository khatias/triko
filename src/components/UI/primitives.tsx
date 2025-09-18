import React from "react";

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
    className="min-w-0 break-words text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900 leading-snug"
  >
    {children}
  </h2>
);

export const P = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <p
    className={`text-base leading-7 text-gray-700 whitespace-normal break-words ${className}`}
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
