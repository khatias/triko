import type { MetadataRoute } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://triko.ge").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "ka"] as const;

  const staticPaths = [
    "", // home
    "/products",
    "/aboutUs",
    "/contact",
    "/privacy",
    "/terms",
    "/shipping-policy",
    "/exchange-policy",
  ];

  const categorySlugs = ["silk", "triko"]; // make sure these actually match your routes

  const now = new Date();

  const urls: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
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