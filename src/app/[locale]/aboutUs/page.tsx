// app/[locale]/about/page.tsx
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import aboutCover from "../../../assets/aboutCover.jpeg";
import aboutCover3 from "../../../assets/aboutCover7.jpg";

// ---------- types ----------
type Store = { title: string; address: string; mapsHref?: string };

// ---------- metadata (localized) ----------
export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "About" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: "/about",
      languages: { "en-US": "/en/about", "ka-GE": "/ka/about" },
    },
    openGraph: { title: t("meta.title"), description: t("meta.description"), type: "website" },
  } as const;
}

// ---------- tiny UI primitives ----------
const Section = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <section className={`container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 ${className}`}>
    {children}
  </section>
);

const Card = ({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) => (
  <div
    className={`rounded-3xl border border-rose-100 bg-white/80 shadow-[0_2px_20px_rgba(0,0,0,0.04)] backdrop-blur ${className}`}
  >
    {children}
  </div>
);

const H2 = ({ children }: React.PropsWithChildren) => (
  <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-gray-900">{children}</h2>
);

const P = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <p className={`text-base leading-7 text-gray-700 ${className}`}>{children}</p>
);

// ---------- page ----------
export default function AboutPage() {
  const t = useTranslations("About");

  // values must match your translation keys: values.items.[key]
  const values = ["quality", "comfort", "design", "service"] as const;

  // locations from messages to keep everything translatable
  const storesRaw = t.raw("locations.items") as Record<string, Store> | Store[];
  const stores: Store[] = Array.isArray(storesRaw) ? storesRaw : Object.values(storesRaw);

  return (
    <main className="min-h-screen selection:bg-rose-200/60 bg-[linear-gradient(to_bottom,#fff,#fff_30%,#fff1f3_60%,#fff_95%)]">
      {/* Hero */}
      <Section className="py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-rose-500">{t("hero.kicker")}</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold leading-tight text-gray-900">{t("hero.title")}</h1>
            <P className="mt-4 max-w-prose">{t("hero.subtitle")}</P>
          </div>

          <Card className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden ring-1 ring-rose-100">
            <Image src={aboutCover} alt={t("hero.imageAlt")} fill className="object-cover" priority />
          </Card>
        </div>
      </Section>

      {/* Story (image card FIRST, then text card) */}
      <Section className="py-10 grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Card className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden ring-1 ring-rose-100">
          <Image src={aboutCover3} alt={t("hero.imageAlt")} fill className="object-cover" priority />
        </Card>

        <Card className="p-8">
          <H2>{t("story.title")}</H2>
          <P className="mt-4">{t("story.paragraph1")}</P>
          <P className="mt-4">{t("story.paragraph2")}</P>
        </Card>
      </Section>

      {/* Mission & Values */}
      <Section className="py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="p-8">
            <H2>{t("mission.title")}</H2>
            <P className="mt-4">{t("mission.desc")}</P>
          </Card>

          <Card className="p-8 lg:col-span-2">
            <H2>{t("values.title")}</H2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {values.map((k) => (
                <li key={k} className="rounded-2xl border border-rose-100 bg-white/80 p-5 shadow-sm">
                  <h4 className="text-base font-semibold tracking-tight text-gray-900">
                    {t(`values.items.${k}.title`)}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{t(`values.items.${k}.desc`)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* Locations */}
      <Section className="py-10">
        <H2>{t("locations.title")}</H2>
        <P className="mt-3 max-w-2xl">{t("locations.subtitle")}</P>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map(({ title, address, mapsHref }) => (
            <Card key={title} className="p-6">
              <h4 className="text-base font-semibold tracking-tight text-gray-900">{title}</h4>
              <p className="mt-2 text-sm text-gray-700">{address}</p>
              {mapsHref && (
                <Link
                  href={mapsHref}
                  target="_blank"
                  className="mt-3 inline-block text-sm font-medium text-rose-600 underline underline-offset-4"
                >
                  {t("locations.openInMaps")}
                </Link>
              )}
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16">
        <Card className="p-10 text-center bg-gradient-to-r from-rose-50/70 to-white">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900">{t("cta.title")}</h3>
          <P className="mx-auto mt-3 max-w-xl">{t("cta.subtitle")}</P>
          <Link
            href="/new-arrivals"
            className="mt-6 inline-block rounded-xl border border-rose-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-600 hover:text-white"
          >
            {t("cta.button")}
          </Link>
        </Card>
      </Section>
    </main>
  );
}
