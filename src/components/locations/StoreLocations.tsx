// src/components/footer/StoreLocations.tsx
import React from "react";
import Link from "next/link";
import { ChevronRightIcon, MapPinIcon } from "@heroicons/react/24/outline";

interface StoreLocationsProps {
  locale: string;
  t: (key: string) => string;
}

const StoreLocations = ({ locale, t }: StoreLocationsProps) => {
  const withLocale = (path: string) => `/${locale}${path}`;

  const stores = [
    { city: "Tbilisi", path: "/aboutUs#locations" },
    { city: "Kutaisi", path: "/aboutUs#locations" },
  ];

  return (
    <div className="">
      {/* Store List */}
      <ul className="">
        {stores.map((store, i) => (
          <li
            key={i}
            className="flex items-center justify-between px-4 py-4 md:gap-4 transition hover:bg-zinc-50"
          >
            {/* Left Side */}
            <div className="flex items-center space-x-2">
              <MapPinIcon className="h-5 w-5 text-rose-500" />
              <span className="text-sm font-medium text-zinc-800">
                {store.city}
              </span>
            </div>

            {/* Right Side */}
            <Link
              href={withLocale(store.path)}
              className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 hover:text-zinc-900"
            >
              {t("links.view") ?? "View"}
              <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StoreLocations;
