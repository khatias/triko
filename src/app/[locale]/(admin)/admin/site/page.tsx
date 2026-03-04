// src/app/[locale]/(admin)/admin/site/page.tsx
import { createClient } from "@/utils/supabase/server";
import BannerEditor from "./_components/BannerEditor";
import HeroEditor from "./_components/HeroEditor";
import FeaturedProductsEditor from "./_components/FeaturedProductsEditor";
import { Section } from "@/components/UI/primitives";
import { getTranslations } from "next-intl/server";

type Locale = "en" | "ka";

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{ saved?: string; v?: string }>;
};

type BannerRow = {
  key: "top_banner";
  is_active: boolean;
  en_text: string;
  ka_text: string;
  cta_href: string;
  cta_label_en: string;
  cta_label_ka: string;
};

type HeroRow = {
  key: "home_hero";
  is_active: boolean;

  image_main_path: string | null;
  image_side_path: string | null;

  main_image_label_en: string;
  main_image_label_ka: string;

  main_card_label_en: string;
  main_card_label_ka: string;

  title_en: string;
  title_ka: string;

  subtitle_en: string;
  subtitle_ka: string;

  cta_primary_href: string;
  cta_secondary_href: string;

  info_tag_en: string;
  info_tag_ka: string;

  info_title_en: string;
  info_title_ka: string;

  info_subtitle_en: string;
  info_subtitle_ka: string;

  details_label_en: string;
  details_label_ka: string;
};

type FeaturedProductRow = {
  id: string;
  key: string;
  parent_code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default async function AdminSitePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;

  const t = await getTranslations({ locale, namespace: "Admin.site" });
  const supabase = await createClient();

  const [
    { data: bannerData, error: bannerError },
    { data: heroData, error: heroError },
    { data: featuredData, error: featuredError },
  ] = await Promise.all([
    supabase
      .from("site_banners")
      .select("key,is_active,en_text,ka_text,cta_href,cta_label_en,cta_label_ka")
      .eq("key", "top_banner")
      .maybeSingle<BannerRow>(),

    supabase
      .from("site_hero")
      .select("*")
      .eq("key", "home_hero")
      .maybeSingle<HeroRow>(),

    supabase
      .from("featured_products")
      .select("id,key,parent_code,sort_order,is_active,created_at,updated_at")
      .eq("key", "home_featured")
      .order("sort_order", { ascending: true })
      .order("parent_code", { ascending: true })
      .returns<FeaturedProductRow[]>(),
  ]);

  if (bannerError) throw new Error(bannerError.message);
  if (heroError) throw new Error(heroError.message);
  if (featuredError) throw new Error(featuredError.message);

  const banner: BannerRow = bannerData ?? {
    key: "top_banner",
    is_active: false,
    en_text: "",
    ka_text: "",
    cta_href: "/products",
    cta_label_en: "Shop Now",
    cta_label_ka: "დაათვალიერე",
  };

  const hero: HeroRow = heroData ?? {
    key: "home_hero",
    is_active: true,
    image_main_path: "hero/main.jpg",
    image_side_path: "hero/side.jpg",

    main_image_label_en: "Hot Pick",
    main_image_label_ka: "ჰოთ ფიქი",

    main_card_label_en: "New Season",
    main_card_label_ka: "ახალი სეზონი",

    title_en: "Wake Up\nColorful.",
    title_ka: "გაიღვიძე\nფერად.",

    subtitle_en: "Softest robes & boldest prints.",
    subtitle_ka: "ყველაზე რბილი ხალათები და ყველაზე თამამი პრინტტები.",

    cta_primary_href: "/new-arrivals",
    cta_secondary_href: "/categories",

    info_tag_en: "Limited Offer",
    info_tag_ka: "შეზღუდული შეთავაზება",

    info_title_en: "Free\nShipping",
    info_title_ka: "უფასო\nმიტანა",

    info_subtitle_en: "On Orders Over 100₾",
    info_subtitle_ka: "100₾ ზე ზემოთ",

    details_label_en: "Details",
    details_label_ka: "დეტალები",
  };

  const featuredProducts = featuredData ?? [];

  return (
    <Section>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {t("desc")}
      </p>

      <div className="mt-6 space-y-10">
        <BannerEditor locale={locale} initialBanner={banner} />

        <HeroEditor
          locale={locale}
          initialHero={hero}
          saved={sp?.saved === "1"}
          v={sp?.v ?? null}
        />

        <FeaturedProductsEditor
          locale={locale}
          initialKey="home_featured"
          initialRows={featuredProducts}
        />
      </div>
    </Section>
  );
}