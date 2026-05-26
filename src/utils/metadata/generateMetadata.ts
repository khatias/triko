import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type MetaOptions = {
  namespace: string;
  path: string;
};

const SITE_URL = "https://triko.ge";
const OG_IMAGE = "https://triko.ge/og/triko-og-v2.jpg";

function normalizePath(path: string) {
  if (!path || path === "/") return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export async function generateLocalizedMetadata(
  { params }: { params: Promise<{ locale: string }> },
  { namespace, path }: MetaOptions
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace });

  const title = t("meta.title");
  const description = t("meta.description");

  const cleanPath = normalizePath(path);
  const localizedPath = `${SITE_URL}/${locale}${cleanPath}`;

  return {
    metadataBase: new URL(SITE_URL),

    title,
    description,

    alternates: {
      canonical: localizedPath,
      languages: {
        "en-US": `${SITE_URL}/en${cleanPath}`,
        "ka-GE": `${SITE_URL}/ka${cleanPath}`,
      },
    },

    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Triko",
      url: localizedPath,
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Triko",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}