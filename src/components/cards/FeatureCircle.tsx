"use client";

import Link from "next/link";
import Image, { type StaticImageData } from "next/image";

type FeaturedItem = {
  href: string;
  label: string;
  image: StaticImageData | string;
  alt?: string;
};

type Size = "md" | "lg";
const circleSize: Record<Size, string> = {
  md: "h-24 w-24",
  lg: "h-28 w-28",
};

function FeatureCircle({
  item,
  size = "md",
}: {
  item: FeaturedItem;
  size?: Size;
}) {
  return (
    <li className="list-none">
      <Link
        href={item.href}
        aria-label={item.label}
        className="group grid w-28 sm:w-32 max-w-40 place-items-center gap-3 rounded-2xl p-1 outline-none transition-transform duration-200 hover:scale-[1.02] focus-visible:scale-[1.02]"
      >
        <div
          className={`relative ${circleSize[size]} overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200/70 shadow-sm `}
        >
          <Image
            src={item.image}
            alt={item.alt ?? item.label}
            fill
            sizes="(max-width: 640px) 6rem, 7rem"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
          />
        </div>
        <span className="mt-2 text-center text-[13px] leading-tight font-medium text-slate-700 break-words max-w-[6rem] line-clamp-3">
          {item.label}
        </span>
      </Link>
    </li>
  );
}

export default function FeaturedCircles({
  title = "featured",
  items,
  size = "md",
}: {
  title?: string;
  items: FeaturedItem[];
  size?: Size;
}) {
  return (
    <li className=" list-none border-b border-slate-200/70 bg-white/70 p-4 backdrop-blur-sm container mx-auto px-4 ">
      <span className="px-2 text-xs font-light uppercase tracking-[0.2em] text-slate-600 ">
        {title}
      </span>
      <ul className="mt-4 flex flex-wrap  gap-3 sm:gap-6 items-start">
        {items.map((item) => (
          <FeatureCircle
            key={`${item.href}-${item.label}`}
            item={item}
            size={size}
          />
        ))}
      </ul>
    </li>
  );
}
