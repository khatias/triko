// src/components/Header/Banner.tsx
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import LanguageSwitcher from "../toggle/LanguageSwitcher";
import { Section } from "../UI/primitives";

type Props = { locale: "en" | "ka" };

export default async function Banner({ locale }: Props) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_banners")
    .select("is_active,en_text,ka_text,cta_href,cta_label_en,cta_label_ka")
    .eq("key", "top_banner")
    .maybeSingle();

  if (!data?.is_active) return null;

  const text = locale === "ka" ? data.ka_text : data.en_text;
  if (!text?.trim()) return null;

  const ctaLabel = locale === "ka" ? data.cta_label_ka : data.cta_label_en;
  const rawHref = data.cta_href?.trim() || "/products";
  const href = rawHref.startsWith("/")
    ? `/${locale}${rawHref === "/" ? "" : rawHref}`
    : rawHref;

  const showCta = Boolean(ctaLabel?.trim());

  return (
    <div className="w-full bg-[#fcf5e8] py-2 text-center">
      <Section className="flex items-center justify-between ">
        <div className="flex flex-1 flex-wrap items-center justify-center lg:justify-start text-xs font-medium tracking-wide ">
          <span>
            {text}
            {showCta && (
              <Link
                href={href}
                className="ml-3 inline-flex items-center font-bold text-rose-400 hover:text-rose-300 transition-colors"
              >
                {ctaLabel} &rarr;
              </Link>
            )}
          </span>
        </div>
        <div className="hidden lg:block">
          <LanguageSwitcher />
        </div>
      </Section>
    </div>
  );
}
