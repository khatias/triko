import React from "react";
import { wrap } from "../UI/primitives";
import { DesktopItem } from "./DesktopItem";
import LanguageSwitcher from "../toggle/LanguageSwitcher";

export type NavChild = { id: string | number; name: string; href: string };
export type NavItem = {
  id: string | number;
  name: string;
  href: string;
  children?: NavChild[];
};

function BottomNavBar({ categories }: { categories: NavItem[] }) {
  return (
    <ul
      className={`${wrap} hidden lg:flex items-center
        bg-white  border-t border-gray-100
        w-full py-4 text-lg font-semibold tracking-wider gap-12`}
    >
      {categories.map((item) => (
        <DesktopItem key={item.id} item={item} />
      ))}

      <li className="ml-auto">
        <LanguageSwitcher />
      </li>
    </ul>
  );
}

export default BottomNavBar;
