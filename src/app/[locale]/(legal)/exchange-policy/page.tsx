// src/app/[locale]/(legal)/exchange-policy/page.tsx
import Link from "next/link";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { useTranslations } from "next-intl";
import { Section } from "@/components/UI/primitives";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "ExchangePolicy",
    path: "/exchange-policy",
  });
}

export default function ExchangePolicyPage() {
  const t = useTranslations("ExchangePolicy");

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
            className="text-5xl md:text-8xl font-serif font-medium tracking-tight leading-[0.9] mb-8 text-neutral-950"
            id="exchange-policy-title"
          >
            {t("hero.title")}
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-xl md:text-2xl text-neutral-800 font-medium leading-relaxed">
            {t("hero.description")}
          </p>

          {/* Metadata Pills */}
          <div className="mt-12 flex flex-wrap gap-4 text-sm font-bold">
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
          
              {t("hero.windowLabel")} {t("hero.windowDays")}
            </span>
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
              {t("hero.notePills")}
            </span>
          </div>
        </div>
      </Section>

      {/* BIGGER, SPACIOUS CONTENT LAYOUT */}
      <Section className="py-16 md:py-24" labelledBy="exchange-policy-title">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-10 lg:gap-16">
            {/* STICKY SIDEBAR / TABLE OF CONTENTS */}
            <aside className="hidden lg:block lg:sticky lg:top-32 h-fit">
              <div className="bg-white border border-neutral-200 rounded-4xl p-8 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C5C] mb-6 pb-4 border-b border-neutral-100">
                  {t("toc.title")}
                </p>
                <nav aria-label={t("toc.aria")} className="space-y-5">
                  {[
                    { id: "#overview", label: t("toc.items.overview") },
                    { id: "#eligible", label: t("toc.items.eligible") },
                    { id: "#conditions", label: t("toc.items.conditions") },
                    { id: "#how", label: t("toc.items.how") },
                  ].map((item) => (
                    <a
                      key={item.id}
                      className="group flex items-center text-base font-medium text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
                      href={item.id}
                    >
                      <span className="w-2 h-2 rounded-full bg-neutral-200 mr-4 group-hover:bg-[#FF5C5C] group-hover:scale-125 transition-all duration-300" />
                      {item.label}
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
              prose-li:text-neutral-600 prose-li:marker:text-[#FF5C5C]"
            >
              <section id="overview" className="scroll-mt-32">
                <h2>{t("sections.overview.title")}</h2>
                <p>{t("sections.overview.p1")}</p>

                {/* Styled Callout Box */}
                <div className="not-prose my-12 relative overflow-hidden rounded-3xl bg-neutral-50 p-10 border border-neutral-100">
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-[#FF5C5C]" />
                  <h3 className="text-base font-bold uppercase tracking-widest text-neutral-900 mb-4 flex items-center gap-3">
                    <svg
                      className="size-6 text-[#FF5C5C]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {t("sections.overview.calloutTitle")}
                  </h3>
                  <p className="text-neutral-600 text-lg leading-relaxed">
                    {t("sections.overview.calloutBody")}
                  </p>
                </div>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="eligible" className="scroll-mt-32">
                <h2>{t("sections.eligible.title")}</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 p-0">
                  {[0, 1].map((idx) => (
                    <li
                      key={idx}
                      className="bg-neutral-50 border border-neutral-100 p-8 rounded-2xl list-none flex gap-5 items-start m-0"
                    >
                      <div className="flex items-center justify-center size-8 rounded-full bg-[#FF5C5C]/10 border border-[#FF5C5C]/20 shrink-0 mt-1">
                        <span className="size-2.5 rounded-full bg-[#FF5C5C]" />
                      </div>
                      <span className="text-neutral-700 text-lg leading-snug">
                        {t(`sections.eligible.items.${idx}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="conditions" className="scroll-mt-32">
                <h2>{t("sections.conditions.title")}</h2>
                <ul className="space-y-6 pl-6">
                  <li className="pl-3">{t("sections.conditions.items.0")}</li>
                  <li className="pl-3">{t("sections.conditions.items.1")}</li>
                  <li className="pl-3">{t("sections.conditions.items.2")}</li>
                </ul>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="how" className="scroll-mt-32">
                <h2>{t("sections.how.title")}</h2>

                {/* Numbered Steps */}
                <ol className="list-none space-y-6 pl-0 mt-10">
                  {[0, 1, 2].map((idx) => (
                    <li
                      key={idx}
                      className="flex gap-6 p-6 rounded-3xl border border-neutral-100 bg-neutral-50 m-0 items-center"
                    >
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-neutral-200 text-[#FF5C5C] text-xl font-bold shadow-sm">
                        {idx + 1}
                      </span>
                      <span className="text-neutral-700 text-lg font-medium">
                        {t(`sections.how.steps.${idx}`)}
                      </span>
                    </li>
                  ))}
                </ol>

                {/* Help / Contact Section */}
                <div className="not-prose mt-20 pt-12 border-t-2 border-dashed border-neutral-200">
                  <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between bg-white p-10 rounded-3xl border border-neutral-200 shadow-sm">
                    <div>
                      <a
                        href={`mailto:${t("contactEmail")}`}
                        className="text-3xl font-serif text-neutral-900 hover:text-[#FF5C5C] transition-colors decoration-neutral-200 underline-offset-8"
                      >
                        {t("contactEmail")}
                      </a>
                    </div>

                    <Link
                      href="/terms"
                      className="px-10 py-5 rounded-2xl bg-[#FF5C5C] text-white text-lg font-bold hover:bg-[#ff4444] transition-all active:scale-95 shadow-lg shadow-[#FF5C5C]/30"
                    >
                      {t("cta.terms")}
                    </Link>
                  </div>
                </div>
              </section>

              {/* Footer Note */}
              <section className="not-prose mt-16 p-10 rounded-4xl bg-[#FF5C5C]/5 border border-[#FF5C5C]/20 text-neutral-700 text-base leading-relaxed">
                <p className="font-bold text-[#FF5C5C] uppercase tracking-widest text-sm mb-4 flex items-center gap-3">
                  <span className="size-2 bg-[#FF5C5C] rounded-full" />
                  {t("footer.noteTitle")}
                </p>
                <p className="text-neutral-700 text-lg">
                  {t("footer.noteBody")}
                </p>
              </section>
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}
