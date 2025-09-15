import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Section } from "../UI/primitives";
import kimano from "../../assets/categoyCoverKimano.jpg";
import boxer from "../../assets/categoyCoverBoxer.jpg";
import pajama from "../../assets/categoyCoverPajama.jpg";
import dress from "../../assets/categoryCoverDress.jpg";

const categoryTiles = [
  { key: "dress", href: "/shop?category=dress", img: dress },
  { key: "kimano", href: "/shop?category=kimano", img: kimano },
  { key: "boxers", href: "/shop?category=boxers", img: boxer },
  { key: "pajamas", href: "/shop?category=pajamas", img: pajama },
] as const;

const TILE_CLASSES =
  "group block rounded-2xl border border-zinc-200 bg-white/90 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-rose-500";
const ASPECT = "aspect-[4/5]";
const TITLE_ID = "category-tiles-title";

export default async function CategoryTiles() {
  const t = await getTranslations("Home.Categories");

  return (
    <Section labelledBy={TITLE_ID} className="py-16">
      <h2
        id={TITLE_ID}
        className="text-xl font-bold font-serif-display tracking-tight text-neutral-800 select-none mb-8"
      >
        {t("title")}
      </h2>

      <ul
        role="group"
        aria-labelledby={TITLE_ID}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
      >
        {categoryTiles.map((tile, index) => (
          <li key={tile.key}>
            <Link
              href={tile.href}
              aria-label={t(`items.${tile.key}`)}
              className={TILE_CLASSES}
              prefetch={false}
            >
              <div className={`relative ${ASPECT}`}>
                <Image
                  src={tile.img}
                  alt={t(`items.${tile.key}`)}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover object-center transition-transform duration-500 will-change-transform motion-safe:group-hover:scale-[1.06] select-none"
                  priority={index === 0}
                  placeholder="blur"
                />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-base font-medium text-neutral-900 transition-colors group-hover:text-neutral-700">
                  {t(`items.${tile.key}`)}
                </span>
                <span
                  aria-hidden
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-neutral-500 transition-all group-hover:translate-x-1 group-hover:shadow-sm"
                >
                  →
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
