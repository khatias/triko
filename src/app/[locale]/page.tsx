import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import Hero from "@/components/home/Hero";
import StorySlice from "@/components/home/StorySlice";
import StatusStrip from "@/components/home/StatusStrip";
import { wrap } from "@/components/UI/primitives";
import CategoryAccordion from "@/components/home/FeaturedSection";
import ProductSlider from "@/components/home/ProductSlider";
import { getProductsByParentCodes } from "@/lib/db/products";
import { getFeaturedParentCodes } from "@/lib/db/featured";
import { getFeaturedGroups } from "@/lib/db/groups";

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

  const parentCodes = await getFeaturedParentCodes("home_featured", 12);
  const catalog = parentCodes.length
    ? await getProductsByParentCodes(parentCodes)
    : [];

  const featuredGroups = await getFeaturedGroups();

  return (
    <div className="bg-[#FDFBF9] overflow-hidden">
      <Hero locale={locale} />
      <StatusStrip />
      <ProductSlider catalog={catalog} />

      <CategoryAccordion featuredGroups={featuredGroups} locale={locale} />
      <StorySlice />

      <div className={`${wrap} py-8`} />
    </div>
  );
}
