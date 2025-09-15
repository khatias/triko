import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import Hero from "@/components/home/Hero";
import StorySlice from "@/components/home/StorySlice";
import CategoryTiles from "@/components/home/CategoryTiles";
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, { namespace: "Home", path: "/" });
}
export default function Home() {
  return (
    <div className=" bg-[#FDFBF9] overflow-hidden">
      <Hero />
      <StorySlice />
      <CategoryTiles/>
    </div>
  );
}
