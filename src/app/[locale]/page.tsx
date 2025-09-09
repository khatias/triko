import LanguageSwitcher from "@/components/toggle/LanguageSwitcher";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, { namespace: "Home", path: "/" });
}
export default function Home() {
  return (
    <div>
      <LanguageSwitcher />
    </div>
  );
}
