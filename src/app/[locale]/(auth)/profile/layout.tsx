import React from "react";
import SidebarNav from "../profile/_components/SidebarNav";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { createClient } from "@/utils/supabase/server";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "Profile",
    path: "/profile",
  });
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getNextPath() {
  return (await headers()).get("next-url") || "/profile";
}

async function clearSupabaseCookies() {
  const store = await cookies();
  for (const c of store.getAll()) {
    if (c.name.startsWith("sb-")) {
      store.delete(c.name);
    }
  }
}

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supabase = await createClient();

  const { data, error: claimsErr } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (claimsErr) {
    if (claimsErr.code === "refresh_token_not_found") {
      clearSupabaseCookies();
    }
    redirect(`/${locale}/login?next=${encodeURIComponent(await getNextPath())}`);
  }

  if (!userId) {
    redirect(`/${locale}/login?next=${encodeURIComponent(await getNextPath())}`);
  }

  let fullName = "Guest";

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profileErr && profile?.full_name) fullName = profile.full_name;

  return (
    <main className="min-h-screen container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-6 lg:py-10 mb-40">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="hidden lg:block lg:col-span-3">
          <SidebarNav fullName={fullName} />
        </aside>
        <section className="lg:col-span-9">{children}</section>
      </div>
    </main>
  );
}