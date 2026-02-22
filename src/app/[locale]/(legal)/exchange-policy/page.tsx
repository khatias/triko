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
    <main className="bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* HERO SECTION */}
      <Section className="relative py-24 md:py-32 bg-linear-to-b from-neutral-50 to-white border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-6">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-4 mb-8">
            <span className="inline-flex items-center justify-center size-2 rounded-full bg-neutral-900 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-500">
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
          <p className="max-w-2xl text-lg md:text-xl text-neutral-600 font-light leading-relaxed">
            {t("hero.description")}
          </p>

          {/* Metadata Pills */}
          <div className="mt-12 flex flex-wrap gap-3 text-xs font-medium">
            <span className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-neutral-900 shadow-sm">
              <span className="mr-2 text-neutral-400">Timeframe:</span>
              {t("hero.windowLabel")} {t("hero.windowDays")}
            </span>
            <span className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-neutral-900 shadow-sm">
              {t("hero.notePills")}
            </span>
          </div>
        </div>
      </Section>

      {/* CONTENT LAYOUT */}
      <Section className="py-20" labelledBy="exchange-policy-title">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            
            {/* STICKY SIDEBAR / TABLE OF CONTENTS */}
            <aside className="hidden lg:block lg:sticky lg:top-32 h-fit">
              <div className="pl-4 border-l border-neutral-100">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
                  {t("toc.title")}
                </p>
                <nav aria-label={t("toc.aria")} className="space-y-4">
                  {[
                    { id: "#overview", label: t("toc.items.overview") },
                    { id: "#eligible", label: t("toc.items.eligible") },
                    { id: "#conditions", label: t("toc.items.conditions") },
                    { id: "#how", label: t("toc.items.how") },
                  ].map((item) => (
                    <a
                      key={item.id}
                      className="group flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors duration-200"
                      href={item.id}
                    >
                      <span className="w-0 group-hover:w-2 h-px bg-neutral-900 mr-0 group-hover:mr-2 transition-all duration-300 ease-out" />
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* MAIN POLICY CONTENT */}
            <article className="prose prose-lg prose-neutral max-w-none 
              prose-headings:font-serif prose-headings:font-medium 
              prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 
              prose-p:text-neutral-600 prose-p:leading-8
              prose-li:text-neutral-600 prose-li:marker:text-neutral-300">
              
              <section id="overview" className="scroll-mt-32">
                <h2>{t("sections.overview.title")}</h2>
                <p>{t("sections.overview.p1")}</p>

                {/* Styled Callout Box */}
                <div className="not-prose my-10 relative overflow-hidden rounded-xl bg-neutral-50 p-8 border border-neutral-100">
                  <div className="absolute top-0 left-0 w-1 h-full bg-neutral-900" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-900 mb-3">
                    {t("sections.overview.calloutTitle")}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {t("sections.overview.calloutBody")}
                  </p>
                </div>
              </section>

              <section id="eligible" className="scroll-mt-32">
                <h2>{t("sections.eligible.title")}</h2>
                <ul className="grid grid-cols-1 gap-2">
                  <li className="bg-white border border-neutral-100 p-4 rounded-lg shadow-sm list-none flex gap-3 items-baseline">
                    <span className="size-2 rounded-full bg-green-500 shrink-0 self-center" />
                    {t("sections.eligible.items.0")}
                  </li>
                  <li className="bg-white border border-neutral-100 p-4 rounded-lg shadow-sm list-none flex gap-3 items-baseline">
                    <span className="size-2 rounded-full bg-green-500 shrink-0 self-center" />
                    {t("sections.eligible.items.1")}
                  </li>
                </ul>
              </section>

              <section id="conditions" className="scroll-mt-32">
                <h2>{t("sections.conditions.title")}</h2>
                <ul className="space-y-4">
                  <li>{t("sections.conditions.items.0")}</li>
                  <li>{t("sections.conditions.items.1")}</li>
                  <li>{t("sections.conditions.items.2")}</li>
                </ul>
              </section>

              <section id="how" className="scroll-mt-32">
                <h2>{t("sections.how.title")}</h2>
                
                {/* Numbered Steps */}
                <ol className="list-none space-y-6 pl-0">
                  {[0, 1, 2].map((idx) => (
                    <li key={idx} className="flex gap-5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-xs font-bold text-neutral-900">
                        {idx + 1}
                      </span>
                      <span className="pt-1">{t(`sections.how.steps.${idx}`)}</span>
                    </li>
                  ))}
                </ol>

                <div className="not-prose mt-12 pt-10 border-t border-neutral-100">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                        Need help?
                      </p>
                      <a
                        href={`mailto:${t("contactEmail")}`}
                        className="text-2xl font-serif text-neutral-900 hover:underline decoration-1 underline-offset-4"
                      >
                        {t("contactEmail")}
                      </a>
                    </div>
                    
                    <Link
                      href="/terms"
                      className="px-6 py-3 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-transform active:scale-95"
                    >
                      {t("cta.terms")}
                    </Link>
                  </div>
                </div>
              </section>

              {/* Footer Note */}
              <section className="not-prose mt-16 p-6 rounded-2xl bg-neutral-900 text-neutral-400 text-sm leading-relaxed">
                <p className="font-bold text-white uppercase tracking-widest text-xs mb-3">
                  {t("footer.noteTitle")}
                </p>
                {t("footer.noteBody")}
              </section>
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}