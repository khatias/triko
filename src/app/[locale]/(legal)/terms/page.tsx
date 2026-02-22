import Link from "next/link";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { useTranslations } from "next-intl";
import { Section } from "@/components/UI/primitives";

export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "Terms",
    path: "/terms",
  });
}

const SECTION_IDS = [
  "about",
  "eligibility",
  "accounts",
  "orders",
  "pricing",
  "shipping",
  "returns",
  "payments",
  "content",
  "acceptable-use",
  "warranties",
  "liability",
  "changes",
  "law",
  "contact",
] as const;

export default function TermsPage() {
  const t = useTranslations("Terms");

  return (
    // ESTHETIC UPDATE: Switched to 'bg-stone-50' for paper-like warmth
    // ESTHETIC UPDATE: Switched selection color to 'amber' (knitwear/warmth vibe)
    <main className="bg-stone-50 text-stone-900 selection:bg-amber-200 selection:text-amber-900">
      
      {/* HERO */}
      {/* ESTHETIC UPDATE: Warm background #F7F7F5 is good, but added stone border */}
      <Section className="relative py-20 md:py-28 bg-[#F7F7F5] border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            {/* ESTHETIC UPDATE: Added Amber accent dot */}
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            <span className="text-[10px] uppercase tracking-[0.6em] font-black text-stone-900">
              {t("hero.kicker")}
            </span>
            <div className="h-px flex-1 bg-stone-900 opacity-15" />
          </div>

          <h1
            className="text-5xl md:text-7xl font-serif tracking-tighter leading-[0.95] mb-8 text-stone-900"
            id="terms-title"
          >
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-stone-600 font-light leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-xs">
            {/* ESTHETIC UPDATE: Stone borders and text */}
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-600">
              {t("hero.lastUpdatedLabel")} {t("hero.lastUpdatedDate")}
            </span>
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-stone-600">
              {t("hero.appliesTo")}
            </span>
          </div>
        </div>
      </Section>

      {/* CONTENT */}
      <Section className="py-16 md:py-20" labelledBy="terms-title">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            
            {/* Sticky TOC */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-400 mb-4">
                  {t("toc.title")}
                </p>

                <nav aria-label={t("toc.aria")} className="space-y-1">
                  {SECTION_IDS.map((id) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
                    >
                      <span className="transition group-hover:translate-x-0.5">
                        {t(`toc.items.${id}` as const)}
                      </span>
                      {/* ESTHETIC UPDATE: Active/Hover state becomes Amber */}
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-200 group-hover:bg-amber-600 transition" />
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main terms */}
            {/* ESTHETIC UPDATE: 'prose-neutral' -> 'prose-stone' for warmer gray text */}
            <article className="prose prose-stone max-w-none 
              prose-headings:font-serif prose-headings:text-stone-900 
              prose-h2:tracking-tight prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:leading-tight 
              prose-a:text-stone-900 prose-a:font-semibold prose-a:no-underline hover:prose-a:text-amber-700 hover:prose-a:underline
              prose-li:marker:text-amber-600">
              
              <section id="about" className="scroll-mt-28">
                <h2>{t("sections.about.title")}</h2>
                <p>{t("sections.about.body")}</p>
              </section>

              <section id="eligibility" className="scroll-mt-28">
                <h2>{t("sections.eligibility.title")}</h2>
                <p>{t("sections.eligibility.body")}</p>
              </section>

              <section id="accounts" className="scroll-mt-28">
                <h2>{t("sections.accounts.title")}</h2>
                <p>{t("sections.accounts.body")}</p>
              </section>

              <section id="orders" className="scroll-mt-28">
                <h2>{t("sections.orders.title")}</h2>
                <p>{t("sections.orders.body")}</p>
              </section>

              <section id="pricing" className="scroll-mt-28">
                <h2>{t("sections.pricing.title")}</h2>
                <p>{t("sections.pricing.body")}</p>
              </section>

              <section id="shipping" className="scroll-mt-28">
                <h2>{t("sections.shipping.title")}</h2>
                <p>{t("sections.shipping.body")}</p>
              </section>

              <section id="returns" className="scroll-mt-28">
                <h2>{t("sections.returns.title")}</h2>
                <p>{t("sections.returns.body")}</p>
              </section>

              <section id="payments" className="scroll-mt-28">
                <h2>{t("sections.payments.title")}</h2>
                <p>{t("sections.payments.body")}</p>
              </section>

              <section id="content" className="scroll-mt-28">
                <h2>{t("sections.content.title")}</h2>
                <p>{t("sections.content.body")}</p>
              </section>

              <section id="acceptable-use" className="scroll-mt-28">
                <h2>{t("sections.acceptableUse.title")}</h2>
                <ul>
                  <li>{t("sections.acceptableUse.items.0")}</li>
                  <li>{t("sections.acceptableUse.items.1")}</li>
                  <li>{t("sections.acceptableUse.items.2")}</li>
                  <li>{t("sections.acceptableUse.items.3")}</li>
                </ul>
              </section>

              <section id="warranties" className="scroll-mt-28">
                <h2>{t("sections.warranties.title")}</h2>
                <p>{t("sections.warranties.body")}</p>
              </section>

              <section id="liability" className="scroll-mt-28">
                <h2>{t("sections.liability.title")}</h2>
                <p>{t("sections.liability.body")}</p>
              </section>

              <section id="changes" className="scroll-mt-28">
                <h2>{t("sections.changes.title")}</h2>
                <p>{t("sections.changes.body")}</p>
              </section>

              <section id="law" className="scroll-mt-28">
                <h2>{t("sections.law.title")}</h2>
                <p>{t("sections.law.body")}</p>
              </section>

              <section id="contact" className="scroll-mt-28">
                <h2>{t("sections.contact.title")}</h2>
                <p>
                  {t("sections.contact.p1")}{" "}
                  <a href={`mailto:${t("contactEmail")}`}>{t("contactEmail")}</a>.
                </p>
                <p>
                  {t("sections.contact.p2")}{" "}
                  <Link href="/privacy-policy" className="font-semibold">
                    {t("sections.contact.privacyLink")}
                  </Link>{" "}
                  {t("sections.contact.p3")}
                </p>
              </section>

              <section className="not-prose mt-14">
                <div className="rounded-2xl border border-stone-200 bg-[#F7F7F5] p-8">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-stone-900 mb-2">
                    {t("note.title")}
                  </p>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {t("note.body")}
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