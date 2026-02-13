// src/app/[locale]/(legal)/shipping-policy/page.tsx
import Link from "next/link";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { useTranslations } from "next-intl";
import { Section } from "@/components/UI/primitives";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "ShippingPolicy",
    path: "/shipping-policy",
  });
}

export default function ShippingPolicyPage() {
  const t = useTranslations("ShippingPolicy");

  return (
    <main className="bg-white text-neutral-950 selection:bg-neutral-900 selection:text-white">
      {/* HERO */}
      <Section className="relative py-20 md:py-28 bg-[#F7F7F5] border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-[10px] uppercase tracking-[0.6em] font-black text-neutral-900">
              {t("hero.kicker")}
            </span>
            <div className="h-px flex-1 bg-neutral-900 opacity-15" />
          </div>

          <h1
            className="text-5xl md:text-7xl font-serif tracking-tighter leading-[0.95] mb-8"
            id="shipping-policy-title"
          >
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-neutral-700 font-light leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700">
              {t("hero.tbilisiPill")}
            </span>
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700">
              {t("hero.regionsPill")}
            </span>
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700">
              {t("hero.internationalPill")}
            </span>
          </div>
        </div>
      </Section>

      {/* CONTENT */}
      <Section className="py-16 md:py-20" labelledBy="shipping-policy-title">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            {/* Sticky TOC */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-900 mb-4">
                  {t("toc.title")}
                </p>

                <nav aria-label={t("toc.aria")} className="space-y-2">
                  <a
                    className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    href="#tbilisi"
                  >
                    <span className="transition group-hover:translate-x-0.5">
                      {t("toc.items.tbilisi")}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition" />
                  </a>

                  <a
                    className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    href="#regions"
                  >
                    <span className="transition group-hover:translate-x-0.5">
                      {t("toc.items.regions")}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition" />
                  </a>

                  <a
                    className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    href="#international"
                  >
                    <span className="transition group-hover:translate-x-0.5">
                      {t("toc.items.international")}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition" />
                  </a>

                  <a
                    className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    href="#support"
                  >
                    <span className="transition group-hover:translate-x-0.5">
                      {t("toc.items.support")}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition" />
                  </a>
                </nav>
              </div>
            </aside>

            {/* Main policy */}
            <article className="prose prose-neutral max-w-none prose-h2:font-serif prose-h2:tracking-tight prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:leading-tight">
              <section id="tbilisi" className="scroll-mt-28">
                <h2>{t("sections.tbilisi.title")}</h2>
                <p>{t("sections.tbilisi.body")}</p>

                <div className="not-prose mt-8 rounded-2xl border border-neutral-200 bg-[#F7F7F5] p-7">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-900 mb-2">
                    {t("sections.tbilisi.calloutTitle")}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
                    {t("sections.tbilisi.calloutBody")}
                  </p>
                </div>
              </section>

              <section id="regions" className="scroll-mt-28">
                <h2>{t("sections.regions.title")}</h2>
                <p>{t("sections.regions.body")}</p>
              </section>

              <section id="international" className="scroll-mt-28">
                <h2>{t("sections.international.title")}</h2>
                <p>{t("sections.international.body")}</p>
              </section>

              <section id="support" className="scroll-mt-28">
                <h2>{t("sections.support.title")}</h2>
                <p>
                  {t("sections.support.body")}{" "}
                  <a href={`mailto:${t("contactEmail")}`}>{t("contactEmail")}</a>.
                </p>

                <p className="not-prose mt-10">
                  <Link
                    href="/terms"
                    className="inline-flex items-center rounded-xl border border-neutral-200 px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-900 hover:bg-neutral-50 transition"
                  >
                    {t("cta.terms")}
                  </Link>
                </p>
              </section>
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}
