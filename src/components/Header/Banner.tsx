import { useTranslations } from "next-intl";

export default function Banner() {
  const t = useTranslations("Banner");

  return (
    <div className="py-1.5 text-center text-xs md:text-sm text-stone-900 bg-rose-200">
      {t("bannerTitle")}
    </div>
  );
}
