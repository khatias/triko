import { notFound } from "next/navigation";
import CategoryGrid from "@/components/categories/CategoryGrid";
import { fetchCategoryBySlugEN, fetchChildCategories } from "@/lib/db/categories";

export default async function CategorySlugPage({
  params,
}: {
  params: Promise<{ locale: "en" | "ka"; slug: string }>;
}) {
  const { locale, slug } = await params; // slug is EN-only now

  const category = await fetchCategoryBySlugEN(slug, locale);
  if (!category) return notFound();

  const children = await fetchChildCategories(category.id, locale);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">{category.name}</h1>

      {children.length ? (
        <CategoryGrid
          items={children.map((c) => ({
            id: c.id,
            name: c.name,
            href: `/${locale}/categories/${encodeURIComponent(c.route_slug)}`, // 👈 EN slug
            imageUrl: c.image_url,
          }))}
        />
      ) : (
        <p className="text-sm text-gray-500">
          {locale === "ka" ? "ქვეკატეგორია არ არის." : "No subcategories yet."}
        </p>
      )}
    </section>
  );
}
