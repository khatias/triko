import React from "react";
import { useTranslations } from "next-intl";
function Banner() {
  const t = useTranslations("Banner");
  return (
    <div className=" py-1.5 text-center text-xs md:text-sm text-stone-900 font-medium">
      {t("bannerTitle")}
    </div>
  );
}

export default Banner;
