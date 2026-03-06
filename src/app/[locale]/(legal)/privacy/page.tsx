// src/app/[locale]/(legal)/privacy-policy/page.tsx
import Link from "next/link";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { useTranslations } from "next-intl";
import { Section } from "@/components/UI/primitives";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "PrivacyPolicy",
    path: "/privacy-policy",
  });
}

const SECTION_IDS = [
  "who-we-are",
  "info-we-collect",
  "how-we-use",
  "cookies",
  "sharing",
  "payments",
  "security",
  "retention",
  "your-rights",
  "children",
  "international",
  "contact",
] as const;

export default function PrivacyPolicyPage() {
  const t = useTranslations("PrivacyPolicy");

  return (
    <main className="bg-neutral-50 text-neutral-900 selection:bg-[#FF5C5C] selection:text-white pb-32">
      {/* EDGE-TO-EDGE HERO WITH ROUNDED BOTTOM */}
      <Section className="relative py-24 md:py-32 bg-[#FFDE85] rounded-b-[3rem] md:rounded-b-[4rem] shadow-sm overflow-hidden border-b border-[#FFDE85]/80">
        <div className="mx-auto px-6 max-w-6xl">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-4 mb-8">
            <span className="inline-flex items-center justify-center size-3 rounded-full bg-[#FF5C5C] animate-pulse shadow-sm" />
            <span className="text-xs md:text-sm uppercase font-bold text-neutral-800 bg-white/50 px-4 py-1.5 rounded-full border border-white">
              {t("hero.kicker")}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-7xl lg:text-7xl font-serif font-medium mb-6 md:mb-8 text-neutral-950 leading-tight wrap-break-word"
            id="privacy-policy-title"
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
              <span className="mr-2 text-neutral-500 font-medium">
                Last Updated:
              </span>
              {t("hero.lastUpdatedDate")}
            </span>
            <span className="inline-flex items-center rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm px-6 py-3 text-neutral-900 shadow-sm">
              {t("hero.appliesTo")}
            </span>
          </div>
        </div>
      </Section>

      {/* BIGGER, SPACIOUS CONTENT LAYOUT */}
      <Section className="py-16 md:py-24" labelledBy="privacy-policy-title">
        <div className="max-w-7xl mx-auto md:px-6 lg:px-8">
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
              <section id="who-we-are" className="scroll-mt-32">
                <h2>{t("sections.whoWeAre.title")}</h2>
                <p>{t("sections.whoWeAre.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="info-we-collect" className="scroll-mt-32">
                <h2>{t("sections.collect.title")}</h2>
                <p>{t("sections.collect.lead")}</p>
                <ul className="space-y-4 pl-6">
                  <li>{t("sections.collect.items.0")}</li>
                  <li>{t("sections.collect.items.1")}</li>
                  <li>{t("sections.collect.items.2")}</li>
                  <li>{t("sections.collect.items.3")}</li>
                  <li>{t("sections.collect.items.4")}</li>
                  <li>{t("sections.collect.items.5")}</li>
                </ul>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="how-we-use" className="scroll-mt-32">
                <h2>{t("sections.use.title")}</h2>
                <p>{t("sections.use.lead")}</p>
                <ul className="space-y-4 pl-6">
                  <li>{t("sections.use.items.0")}</li>
                  <li>{t("sections.use.items.1")}</li>
                  <li>{t("sections.use.items.2")}</li>
                  <li>{t("sections.use.items.3")}</li>
                  <li>{t("sections.use.items.4")}</li>
                  <li>{t("sections.use.items.5")}</li>
                </ul>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="cookies" className="scroll-mt-32">
                <h2>{t("sections.cookies.title")}</h2>
                <p>{t("sections.cookies.p1")}</p>
                <p>{t("sections.cookies.p2")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="sharing" className="scroll-mt-32">
                <h2>{t("sections.sharing.title")}</h2>
                <p>{t("sections.sharing.lead")}</p>
                <ul className="space-y-4 pl-6">
                  <li>{t("sections.sharing.items.0")}</li>
                  <li>{t("sections.sharing.items.1")}</li>
                  <li>{t("sections.sharing.items.2")}</li>
                  <li>{t("sections.sharing.items.3")}</li>
                  <li>{t("sections.sharing.items.4")}</li>
                </ul>
                <p className="mt-8 p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-neutral-700">
                  {t("sections.sharing.note")}
                </p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="payments" className="scroll-mt-32">
                <h2>{t("sections.payments.title")}</h2>
                <p>{t("sections.payments.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="security" className="scroll-mt-32">
                <h2>{t("sections.security.title")}</h2>
                <p>{t("sections.security.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="retention" className="scroll-mt-32">
                <h2>{t("sections.retention.title")}</h2>
                <p>{t("sections.retention.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="your-rights" className="scroll-mt-32">
                <h2>{t("sections.rights.title")}</h2>
                <p>{t("sections.rights.lead")}</p>
                <ul className="space-y-4 pl-6">
                  <li>{t("sections.rights.items.0")}</li>
                  <li>{t("sections.rights.items.1")}</li>
                  <li>{t("sections.rights.items.2")}</li>
                </ul>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="children" className="scroll-mt-32">
                <h2>{t("sections.children.title")}</h2>
                <p>{t("sections.children.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="international" className="scroll-mt-32">
                <h2>{t("sections.international.title")}</h2>
                <p>{t("sections.international.body")}</p>
              </section>

              <div className="w-full h-px bg-neutral-100 my-16" />

              <section id="contact" className="scroll-mt-32">
                <h2>{t("sections.contact.title")}</h2>
                <div className="bg-neutral-50 p-4 rounded-3xl border border-neutral-100 mt-8">
                  <p className="mb-4">
                    {t("sections.contact.p1")}{" "}
                    <a
                      href={`mailto:${t("contactEmail")}`}
                      className="text-[#FF5C5C] font-bold hover:text-[#ff4444]"
                    >
                      {t("contactEmail")}
                    </a>
                    .
                  </p>
                  <p className="m-0">
                    {t("sections.contact.p2")}{" "}
                    <Link
                      href="/terms"
                      className="text-[#FF5C5C] font-bold hover:text-[#ff4444]"
                    >
                      {t("sections.contact.termsLink")}
                    </Link>{" "}
                    {t("sections.contact.p3")}
                  </p>
                </div>
              </section>

    
            </article>
          </div>
        </div>
      </Section>
    </main>
  );
}
