import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import Hero from "@/components/home/Hero";
import StorySlice from "@/components/home/StorySlice";
import FeaturedCollection from "@/components/home/FeaturedSection";
import StatusStrip from "@/components/home/StatusStrip";
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
  console.log("Locale in home page:", locale);
  return (
    <div className=" bg-[#FDFBF9] overflow-hidden">
      <Hero locale={locale} />
      <StatusStrip />
      <FeaturedCollection />
      <StorySlice />
      <div className={`${wrap} py-8`}></div>
    </div>
  );
}
