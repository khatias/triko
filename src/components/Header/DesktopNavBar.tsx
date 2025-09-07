import React from "react";
import Link from "next/link";

import LanguageSwitcher from "../toggle/LanguageSwitcher";

function DesktopNavBar() {
  const navItems = [
    { name: "Boxers", href: "/Boxeres" },
    { name: "Dress", href: "/Dress" },
    { name: "Pants", href: "/Pants" },
    { name: "Kimano", href: "/kimano" },
    { name: "Shorts", href: "/shorts" },
    { name: "Tops", href: "/Tops" },
    { name: "Kids", href: "/Kids" },
  ];
  return (
    <div className="py-2 flex items-center justify-between ">
      <ul className="flex items-center justify-center gap-9">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className="group relative inline-flex items-center px-1.5 py-1 text-[14px] font-medium tracking-[0.08em] text-slate-600 transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 rounded-md"
            >
              <span>{item.name}</span>
              <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 mx-auto h-[2px] w-0 bg-rose-300 transition-all duration-200 group-hover:w-full" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden lg:block">
        <LanguageSwitcher />
      </div>
    </div>
  );
}

export default DesktopNavBar;
