import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/toggle/LanguageSwitcher";
export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <div>
      <h1>{t("title")}</h1>
      <LanguageSwitcher />
    </div>
  );
}
