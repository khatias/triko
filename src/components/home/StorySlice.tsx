import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import robe from "../../assets/girlsInTop.jpg";

export default function StorySlice() {
  const t = useTranslations("Home.Story");

  return (
    <section className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-16 bg-white">
      <div className="rounded-2xl border border-neutral-200 p-4 md:p-8 lg:p-0 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 items-center lg:gap-8">
          {/* Text Content */}
          <div className="p-4 md:p-8 lg:p-16">
            <h3 className="text-3xl lg:text-4xl font-semibold font-sans text-neutral-800 leading-tight tracking-tight">
              {t("title")}
            </h3>
            <p className="mt-4 text-neutral-600 text-lg leading-relaxed max-w-lg">
              {t("sub")}
            </p>
            <Link
              href="/aboutUs"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-neutral-800 px-6 text-sm font-medium text-white transition hover:bg-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
            >
              {t("cta")}
            </Link>
          </div>

          {/* Image */}
          <div className="relative aspect-[3/4] lg:aspect-[4/3] w-full lg:order-first lg:-ml-12 lg:my-8 rounded-3xl overflow-hidden shadow-lg">
            <Image
              src={robe}
              alt={t("imgAlt")}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
