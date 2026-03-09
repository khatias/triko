"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import flag_GE from "../../assets/svgs/ge.svg";
import flag_US from "../../assets/svgs/us.svg";
import { useTranslations } from "next-intl";

const LanguageSwitcher = () => {
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split("/")[1];
  const languages = [
    { code: "ka", label: t("labelKa"), native: "ქართული", flag: flag_GE },
    { code: "en", label: t("labelEn"), native: "English", flag: flag_US },
  ];
  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== currentLocale) {
      const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
      router.push(newPath);
    }
  };

  return (
    <div className="inline-flex items-center">
      <button
        onClick={() =>
          handleLanguageChange(currentLocale === "en" ? "ka" : "en")
        }
        className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium"
      >
        <Image
          className="rounded-full ring-1 ring-gray-200/60 "
          width={20}
          src={currentLanguage?.flag}
          alt={`${currentLanguage?.label} flag`}
        />

        <span className="font-medium text-gray-700 border-l-1 pl-2 border-b-stone-300">
          {currentLanguage?.label}
        </span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
