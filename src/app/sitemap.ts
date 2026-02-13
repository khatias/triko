import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "ka"] as const;

  const staticPaths = [
    "",
    "/products",
    "/cart",
    "/profile",
    "/profile/orders",
    "/profile/addresses",
    "/aboutUs",
    "/contact",
    "/privacy",
    "/terms",
    "/shipping-policy",
    "/exchange-policy",
  ];

  const categorySlugs = ["silk", "triko"];

  const now = new Date();

  const urls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // static
    for (const path of staticPaths) {
      urls.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
      });
    }

    for (const slug of categorySlugs) {
      urls.push({
        url: `${BASE_URL}/${locale}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return urls;
}
