import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import Hero from "@/components/home/Hero";
import StorySlice from "@/components/home/StorySlice";

import CategoryGrid from "@/components/categories/CategoryGrid";
import { fetchTopCategories } from "@/lib/db/categories";
import { wrap } from "@/components/UI/primitives";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, { namespace: "Home", path: "/" });
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: "en" | "ka" }>;
}) {
  const { locale } = await params;
  const categories = await fetchTopCategories(locale);
  return (
    <div className=" bg-[#FDFBF9] overflow-hidden">
      <Hero />
      <StorySlice />
      <div className={`${wrap} py-8`}>
       <CategoryGrid
        items={categories.map((c) => ({
          id: c.id,
          name: c.name,
          href: `/${locale}/categories/${encodeURIComponent(c.route_slug)}`,
          imageUrl: c.image_url,
        }))}
      />
      </div>
 
    </div>
  );
}
