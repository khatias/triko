"use client";
import React from "react";
import { useState } from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { SafeUser } from "@/types/auth";

import Link from "next/link";
export default function AccountMenu({ user }: { user: SafeUser }) {
  const [open, setOpen] = useState(false);
  const fullName = user?.full_name || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";

  return (
    <div>
      <button
        aria-label={user ? `open account menu` : "Sign In"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="rounded-full p-2 hover:bg-slate-100"
      >
        <UserIcon className="h-6 w-6 text-slate-700" />
      </button>
      {open && user && (
        <div>
          <div>Hello, {firstName || user.email}</div>
          <div></div>
          <Link href="/profile">Profile</Link>
          <Link href="/orders">Orders</Link>
          <button>Logout</button>
        </div>
      )}
      {open && !user && (
        <div>
          <Link href="/login">Login</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
      )}
    </div>
  );
}
