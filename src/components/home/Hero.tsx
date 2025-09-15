import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

// assets
import img1 from "../../assets/hero2.jpg";
import img2 from "../../assets/hero1.jpg";
import img3 from "../../assets/hero3.jpg";
import img4 from "../../assets/hero4.jpg";

type Tile = { src: StaticImageData; alt: string };
const TILES: readonly Tile[] = [
  { src: img1, alt: "Couple in colorful pajamas" },
  { src: img2, alt: "Man in blue pajamas" },
  { src: img3, alt: "Couple in SpongeBob pajamas" },
  { src: img4, alt: "Colorful robe" },
] as const;

export default async function Hero() {
  const t = await getTranslations("Home.Hero");

  const titleId = "home-hero-title";
  const descId = "home-hero-desc";

  return (
    <section
      className="relative isolate overflow-hidden pb-5"
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      {/* angled peach sheet */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 h-full w-[100%] md:w-[70%] bg-orange-100/70 -z-10
                   [clip-path:polygon(0_0,_100%_0,_100%_100%,_18%_100%)]
                   lg:[clip-path:polygon(0_0,_100%_0,_100%_100%,_35%_100%)]"
      />

      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32">
        <div className="relative py-12 md:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* LEFT */}
          <div className="md:pl-4 lg:pl-8">
            <h1
              id={titleId}
              className="mt-2 text-4xl sm:text-5xl lg:text-6xl text-[#1C1917] font-bold leading-tight tracking-tight"
            >
              {t("h1")}
            </h1>
            <p
              id={descId}
              className="mt-4 text-base lg:text-lg text-[#5c534b] font-light max-w-xl"
            >
              {t("sub")}
            </p>

            <nav className="mt-8 flex gap-3" aria-label="primary">
              <Link
                href="/shop?sort=new"
                className="inline-flex h-12 items-center rounded-2xl bg-orange-600 px-6 text-sm font-medium text-white shadow-sm
                           transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/50"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/size-guide"
                className="inline-flex h-12 items-center rounded-2xl border border-orange-600 px-6 text-sm font-medium text-orange-700
                           transition hover:bg-orange-600 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-300/40"
              >
                {t("ctaSecondary")}
              </Link>
            </nav>
          </div>

          {/* RIGHT */}
          <div className="relative">
            {/* main wide (priority for LCP) */}
            <figure className="overflow-hidden rounded-3xl shadow-xl border border-zinc-200 bg-white/50">
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={TILES[0].src}
                  alt={TILES[0].alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 motion-safe:hover:scale-[1.03] motion-reduce:transform-none select-none"
                  priority
                  placeholder="blur"
                  draggable={false}
                />
              </div>
            </figure>

            {/* two tall cards (lazy by default) */}
            <div className="mt-6 grid grid-cols-2 gap-6">
              <figure className="overflow-hidden rounded-3xl shadow-xl border border-zinc-200 bg-white/50">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={TILES[1].src}
                    alt={TILES[1].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 motion-safe:hover:scale-[1.03] motion-reduce:transform-none select-none"
                    loading="lazy"
                    draggable={false}
                    placeholder="blur"
                  />
                </div>
              </figure>
              <figure className="overflow-hidden rounded-3xl shadow-xl border border-zinc-200 bg-white/50">
                <div className="relative h-64 md:h-80">
                  <Image
                    src={TILES[2].src}
                    alt={TILES[2].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 motion-safe:hover:scale-[1.03] motion-reduce:transform-none select-none"
                    loading="lazy"
                    draggable={false}
                    placeholder="blur"
                  />
                </div>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
