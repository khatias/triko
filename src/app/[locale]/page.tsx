import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import Hero from "@/components/home/Hero";
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, { namespace: "Home", path: "/" });
}
export default function Home() {
  return (
    <div className=" bg-[#FDFBF9] overflow-hidden">
      <Hero />
    </div>
  );
}
