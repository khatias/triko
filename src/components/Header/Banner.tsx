import { getTranslations } from "next-intl/server";

export default async function Banner() {
  const t = await getTranslations("Banner");

  return (
    <div className="py-1.5 text-center text-xs md:text-sm text-stone-900 bg-rose-200">
      {t("bannerTitle")}
    </div>
  );
}
