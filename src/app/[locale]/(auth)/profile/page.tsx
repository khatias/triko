import { createClient } from "@/utils/supabase/server";
import { Mail, Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/helpers";
import { getTranslations } from "next-intl/server";

function getFirstName(fullName: string | null | undefined) {
  const cleaned = (fullName || "").trim();
  if (!cleaned) return "მომხმარებელო";
  return cleaned.split(/\s+/)[0];
}

type StatCardProps = {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  titleAttr?: string;
};

function StatCard({ title, value, Icon, titleAttr }: StatCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {title}
        </p>
        <p
          className="mt-1 truncate text-base font-bold text-[#172a3e]"
          title={titleAttr}
        >
          {value}
        </p>
      </div>

      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

// --- Page ---
export default async function ProfileIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    fullName = profile?.full_name ?? null;
  }
  const t = await getTranslations("Profile");
  const firstName = getFirstName(fullName);
  const joinDate = formatDate(user?.created_at ?? "");
  const lastLogin = formatDate(user?.last_sign_in_at ?? "");
  const emailValue = user?.email || t("unknown");

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[#172a3e] sm:text-4xl">
          {t("hello", { name: firstName })}
        </h1>

        <p className="mt-3 max-w-md text-slate-500 text-base leading-relaxed">
          {t("subtitle")}
        </p>
      </header>

      <section className="shrink-0 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title={t("email")}
          value={emailValue}
          Icon={Mail}
          titleAttr={user?.email ?? undefined}
        />
        <StatCard title={t("registeredOn")} value={joinDate} Icon={Calendar} />
        <StatCard title={t("lastActivity")} value={lastLogin} Icon={Clock} />
      </section>
    </div>
  );
}
