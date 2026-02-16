import { createClient } from "@/utils/supabase/server";
import BannerEditor from "./_components/BannerEditor";
import { Section } from "@/components/UI/primitives";
import { getTranslations } from "next-intl/server";
type Locale = "en" | "ka";

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AdminSitePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.site" });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_banners")
    .select("key,is_active,en_text,ka_text,cta_href,cta_label_en,cta_label_ka")
    .eq("key", "top_banner")
    .maybeSingle();

  if (error) throw new Error(error.message);

  const banner = data ?? {
    key: "top_banner" as const,
    is_active: false,
    en_text: "",
    ka_text: "",
    cta_href: "/products",
    cta_label_en: "Shop Now",
    cta_label_ka: "დაათვალიერე",
  };

  return (
    <Section>
      <h1 className="text-xl font-semibold text-slate-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-slate-600">{t("desc")}</p>

      <div className="mt-6">
        <BannerEditor locale={locale} initialBanner={banner} />
      </div>
    </Section>
  );
}
