// app/[locale]/about/page.tsx
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import aboutCover from "../../../assets/aboutCover.jpeg";
import aboutCover3 from "../../../assets/aboutCover7.jpg";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { Section, RegularCard, H2, P } from "../../../components/UI/primitives";
// ---------- types ----------
type Store = { title: string; address: string; mapsHref?: string };

// ---------- metadata  ----------
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "About",
    path: "/about",
  });
}

// ---------- page ----------
export default function AboutPage() {
  const t = useTranslations("About");

  // values must match your translation keys: values.items.[key]
  const values = ["quality", "comfort", "design", "service"] as const;

  // locations from messages to keep everything translatable
  const storesRaw = t.raw("locations.items") as Record<string, Store> | Store[];
  const stores: Store[] = Array.isArray(storesRaw)
    ? storesRaw
    : Object.values(storesRaw);

  return (
    <main className="min-h-screen selection:bg-rose-200/60 bg-[linear-gradient(to_bottom,#fff,#fff_30%,#fff1f3_60%,#fff_95%)]">
      {/* Hero */}
      <Section className="py-16" labelledBy="about-hero">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-rose-500">
              {t("hero.kicker")}
            </p>
            <h1
              id="about-hero"
              className="mt-3 text-3xl md:text-4xl font-bold leading-tight text-gray-900"
            >
              {t("hero.title")}
            </h1>
            <P className="mt-4 max-w-prose">{t("hero.subtitle")}</P>
          </div>

          <RegularCard className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden ring-1 ring-rose-100">
            <Image
              src={aboutCover}
              alt={t("hero.imageAlt")}
              fill
              priority
              sizes="(min-width:1024px) 32rem, 90vw"
              className="object-cover"
            />
          </RegularCard>
        </div>
      </Section>

      {/* Story (image card FIRST, then text card) */}
      <Section
        className="py-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16"
        labelledBy="about-story"
      >
        <RegularCard className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden ring-1 ring-rose-100">
          <Image
            src={aboutCover3}
            alt={t("hero.imageAlt")}
            fill
            sizes="(min-width:1024px) 32rem, 90vw"
            className="object-cover"
          />
        </RegularCard>

        <RegularCard className="p-8">
          <H2 id="about-story">{t("story.title")}</H2>
          <P className="mt-4">{t("story.paragraph1")}</P>
          <P className="mt-4">{t("story.paragraph2")}</P>
        </RegularCard>
      </Section>

      {/* Mission & Values */}
      <Section className="py-10" labelledBy="about-mission-values">
        <div className="grid gap-8 lg:grid-cols-3">
          <RegularCard className="p-8 ">
            <H2 id="about-mission-values">{t("mission.title")}</H2>
            <P className="mt-4">{t("mission.desc")}</P>
          </RegularCard>

          <RegularCard className="p-8 lg:col-span-2">
            <H2>{t("values.title")}</H2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {values.map((k) => (
                <li
                  key={k}
                  className="min-w-0 break-words rounded-2xl border border-rose-100 bg-white/80 p-5" // 👈 min-w-0 is key in grid
                >
                  <h4 className="min-w-0 text-base font-semibold tracking-tight text-gray-900">
                    {t(`values.items.${k}.title`)}
                  </h4>

                  <p className="mt-2 min-w-0 break-words text-sm leading-6 text-gray-600">
                    {t(`values.items.${k}.desc`)}
                  </p>
                </li>
              ))}
            </ul>
          </RegularCard>
        </div>
      </Section>

      {/* Locations */}
      <Section id="locations"  className="py-10" labelledBy="about-locations">
        <H2 id="about-locations">{t("locations.title")}</H2>
        <P className="mt-3 max-w-2xl">{t("locations.subtitle")}</P>

        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map(({ title, address, mapsHref }) => (
            <li key={title}>
              <RegularCard className="p-6 min-h-[150px]">
                <article aria-labelledby={`store-${title}`}>
                  <h4
                    id={`store-${title}`}
                    className="text-base font-semibold tracking-tight text-gray-900"
                  >
                    {title}
                  </h4>
                  <address className="mt-2  not-italic text-sm text-gray-700">
                    {address}
                  </address>
                  {mapsHref && (
                    <Link
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-medium text-rose-600 underline underline-offset-4"
                    >
                      {t("locations.openInMaps")}
                    </Link>
                  )}
                </article>
              </RegularCard>
            </li>
          ))}
        </ul>
      </Section>

      {/* CTA */}
      <Section className="py-12 sm:py-16 lg:py-24" labelledBy="about-cta">
        <RegularCard className="flex flex-col items-center p-6 sm:p-10 text-center bg-gradient-to-r from-rose-50/70 to-white">
          <h3
            id="about-cta"
            className="text-3xl min-w-0 break-words pb-4 font-semibold tracking-tight text-zinc-900 "
          >
            {t("cta.title")}
          </h3>

          <P className="mt-2 min-w-0 break-words sm:mt-3 max-w-xl text-sm sm:text-base lg:text-lg">
            {t("cta.subtitle")}
          </P>

          <Link
            href="/new-arrivals"
            className="mt-6 inline-block rounded-xl border border-rose-500 px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm md:text-base font-semibold uppercase tracking-[0.14em] text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white motion-reduce:hover:translate-y-0"
          >
            {t("cta.button")}
          </Link>
        </RegularCard>
      </Section>
    </main>
  );
}
