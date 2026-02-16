import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

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
      <p className="text-[#43423E] text-[11px] font-black tracking-tight flex items-center justify-center gap-2">
        {text}
        {showCta ? (
          <Link href={href} className="text-[#FF5C5C]">
            {ctaLabel}
          </Link>
        ) : null}
      </p>
    </div>
  );
}
