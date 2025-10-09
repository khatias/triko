import { fetchTopCategories } from "@/lib/db/categories";
import CategoryGrid from "@/components/categories/CategoryGrid";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ka" }>;
}) {
  const { locale } = await params;

  const categories = await fetchTopCategories(locale);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">
        {locale === "ka" ? "კატეგორიები" : "Categories"}
      </h1>
      <CategoryGrid
        items={categories.map((c) => ({
          id: c.id,
          name: c.name,
          href: `/${locale}/categories/${encodeURIComponent(c.route_slug)}`, // 👈 EN slug
          imageUrl: c.image_url,
        }))}
      />
    </section>
  );
}
