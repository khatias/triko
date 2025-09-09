import React from "react";

export const Section = ({
  children,
  className = "",
  labelledBy,
}: React.PropsWithChildren<{ className?: string; labelledBy?: string }>) => (
  <section
    aria-labelledby={labelledBy}
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
className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900 leading-snug"
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
