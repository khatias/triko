import { getTranslations } from "next-intl/server";

type MetaOptions = {
  namespace: string; 
  path: string; 
};

export async function generateLocalizedMetadata(
  { params }: { params: Promise<{ locale: string }> },
  { namespace, path }: MetaOptions
) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: path,
      languages: {
        "en-US": `/en${path}`,
        "ka-GE": `/ka${path}`,
      },
    },
    openGraph: {
      title: t("meta.title"),
      description: t("meta.description"),
      type: "website",
    },
  } as const;
}
