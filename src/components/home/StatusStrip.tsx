import { useTranslations } from "next-intl";

export default function StatusStrip() {
  const t = useTranslations("Home.StatusStrip");

  // Keep the text short and sharp.
  const separator = <span className="mx-10 opacity-20">—</span>;

  const content = (
    <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
      <span>{t("seasonValue")}</span>
      {separator}
      <span>{t("featureLeft")}</span>
      {separator}
      <span>{t("featureRight")}</span>
      {separator}
      <span className="text-[#FF5C5C]">{t("scarcity")}</span>
      {separator}
      <span className="font-mono opacity-40">{t("locationCode")}</span>
      {separator}
    </div>
  );

  return (
    <div className="w-full overflow-hidden bg-[#383333] py-3 border-t border-white/5">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {/* Render 3 times to ensure no gaps on large screens */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center">
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}