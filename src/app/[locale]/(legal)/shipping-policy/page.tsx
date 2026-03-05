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

const SECTION_IDS = ["tbilisi", "regions", "international", "support"] as const;

export default function ShippingPolicyPage() {
  const t = useTranslations("ShippingPolicy");

  return (
    <main className="bg-neutral-50 text-neutral-900 selection:bg-[#FF5C5C] selection:text-white pb-32">
      
      {/* EDGE-TO-EDGE HERO WITH ROUNDED BOTTOM */}
      <Section className="relative py-24 md:py-32 bg-[#FFDE85] rounded-b-[3rem] md:rounded-b-[4rem] shadow-sm overflow-hidden border-b border-[#FFDE85]/80">
        <div className="mx-auto px-6 max-w-6xl">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-4 mb-8">
            <span className="inline-flex items-center justify-center size-3 rounded-full bg-[#FF5C5C] animate-pulse shadow-sm" />
            <span className="text-sm uppercase tracking-[0.2em] font-bold text-neutral-800 bg-white/50 px-4 py-1.5 rounded-full border border-white">
              {t("hero.kicker")}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl md:text-7xl font-serif font-medium tracking-tight leading-[0.9] mb-8 text-neutral-950"
            id="shipping-policy-title"
          >
            {t("hero.title")}
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-xl md:text-xl text-neutral-800 font-medium leading-relaxed">
            {t("hero.description")}
          </p>

          {/* Metadata Pills */}
          <div className="mt-12 flex flex-wrap gap-4 text-sm font-bold">
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
              {t("hero.tbilisiPill")}
            </span>
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
              {t("hero.regionsPill")}
            </span>
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
              {t("hero.internationalPill")}
            </span>
          </div>
        </div>
      </Section>

      {/* BIGGER, SPACIOUS CONTENT LAYOUT */}
      <Section className="py-16 md:py-24" labelledBy="shipping-policy-title">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
            
            {/* STICKY SIDEBAR / TABLE OF CONTENTS */}
            <aside className="hidden lg:block lg:sticky lg:top-32 h-fit">
              <div className="bg-white border border-neutral-200 rounded-4xl p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C5C] mb-6 pb-4 border-b border-neutral-100">
                  {t("toc.title")}
                </p>

                <nav aria-label={t("toc.aria")} className="space-y-5">
                  {SECTION_IDS.map((id) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center text-base font-medium text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
                    >
                      <span className="w-2 h-2 rounded-full bg-neutral-200 mr-4 group-hover:bg-[#FF5C5C] group-hover:scale-125 transition-all duration-300 shrink-0" />
                      <span className="transition group-hover:translate-x-1">
                        {t(`toc.items.${id}` as const)}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* MAIN POLICY CONTENT */}
            <article
              className="bg-white border border-neutral-200 rounded-[2.5rem] p-10 md:p-16 shadow-sm
              prose prose-xl prose-neutral max-w-none 
              prose-headings:font-serif prose-headings:font-medium 
              prose-h2:text-4xl prose-h2:mt-14 prose-h2:mb-8 first:prose-h2:mt-0
              prose-p:text-neutral-600 prose-p:leading-relaxed
              prose-li:text-neutral-600 prose-li:marker:text-[#FF5C5C]
              prose-a:text-[#FF5C5C] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#ff4444]"
            >
              <section id="tbilisi" className="scroll-mt-32">
                <h2>{t("sections.tbilisi.title")}</h2>
                <p>{t("sections.tbilisi.body")}</p>

                {/* Styled Callout Box */}
                <div className="not-prose my-12 relative overflow-hidden rounded-3xl bg-neutral-50 p-10 border border-neutral-100">
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-[#FF5C5C]" />
                  <h3 className="text-base font-bold uppercase tracking-widest text-neutral-900 mb-4 flex items-center gap-3">
                    <svg className="size-6 text-[#FF5C5C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t("sections.tbilisi.calloutTitle")}
                  </h3>
                  <p className="text-neutral-600 text-lg leading-relaxed">
                    {t("sections.tbilisi.calloutBody")}
                  </p>
                </div>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="regions" className="scroll-mt-32">
                <h2>{t("sections.regions.title")}</h2>
                <p>{t("sections.regions.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="international" className="scroll-mt-32">
                <h2>{t("sections.international.title")}</h2>
                <p>{t("sections.international.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="support" className="scroll-mt-32">
                <h2>{t("sections.support.title")}</h2>
                <p>
                  {t("sections.support.body")}{" "}
                  <a href={`mailto:${t("contactEmail")}`}>{t("contactEmail")}</a>.
                </p>

                {/* Help / Contact CTA Block */}
                <div className="not-prose mt-16 pt-12 border-t-2 border-dashed border-neutral-200">
                  <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
              

                    <Link
                      href="/terms"
                      className="px-10 py-5 rounded-2xl bg-[#FF5C5C] text-white text-lg font-bold hover:bg-[#ff4444] transition-all active:scale-95 shadow-lg shadow-[#FF5C5C]/30 whitespace-nowrap"
                    >
                      {t("cta.terms")}
                    </Link>
                  </div>
                </div>
              </section>
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}