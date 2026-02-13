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
            id="privacy-policy-title"
          >
            {t("hero.title")}
          </h1>

          <p className="text-lg md:text-xl text-neutral-700 font-light leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700">
              {t("hero.lastUpdatedLabel")} {t("hero.lastUpdatedDate")}
            </span>
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700">
              {t("hero.appliesTo")}
            </span>
          </div>
        </div>
      </Section>

      {/* CONTENT */}
      <Section className="py-16 md:py-20" labelledBy="privacy-policy-title">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
            {/* Sticky TOC */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-900 mb-4">
                  {t("toc.title")}
                </p>

                <nav aria-label={t("toc.aria")} className="space-y-2">
                  {SECTION_IDS.map((id) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="group flex items-center justify-between rounded-lg px-2 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <span className="transition group-hover:translate-x-0.5">
                        {t(`toc.items.${id}` as const)}
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-200 group-hover:bg-neutral-900 transition" />
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Main policy */}
            <article className="prose prose-neutral max-w-none prose-h2:font-serif prose-h2:tracking-tight prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:leading-tight prose-a:text-neutral-900 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">
              <section id="who-we-are" className="scroll-mt-28">
                <h2>{t("sections.whoWeAre.title")}</h2>
                <p>{t("sections.whoWeAre.body")}</p>
              </section>

              <section id="info-we-collect" className="scroll-mt-28">
                <h2>{t("sections.collect.title")}</h2>
                <p>{t("sections.collect.lead")}</p>
                <ul>
                  <li>{t("sections.collect.items.0")}</li>
                  <li>{t("sections.collect.items.1")}</li>
                  <li>{t("sections.collect.items.2")}</li>
                  <li>{t("sections.collect.items.3")}</li>
                  <li>{t("sections.collect.items.4")}</li>
                  <li>{t("sections.collect.items.5")}</li>
                </ul>
              </section>

              <section id="how-we-use" className="scroll-mt-28">
                <h2>{t("sections.use.title")}</h2>
                <p>{t("sections.use.lead")}</p>
                <ul>
                  <li>{t("sections.use.items.0")}</li>
                  <li>{t("sections.use.items.1")}</li>
                  <li>{t("sections.use.items.2")}</li>
                  <li>{t("sections.use.items.3")}</li>
                  <li>{t("sections.use.items.4")}</li>
                  <li>{t("sections.use.items.5")}</li>
                </ul>
              </section>

              <section id="cookies" className="scroll-mt-28">
                <h2>{t("sections.cookies.title")}</h2>
                <p>{t("sections.cookies.p1")}</p>
                <p>{t("sections.cookies.p2")}</p>
              </section>

              <section id="sharing" className="scroll-mt-28">
                <h2>{t("sections.sharing.title")}</h2>
                <p>{t("sections.sharing.lead")}</p>
                <ul>
                  <li>{t("sections.sharing.items.0")}</li>
                  <li>{t("sections.sharing.items.1")}</li>
                  <li>{t("sections.sharing.items.2")}</li>
                  <li>{t("sections.sharing.items.3")}</li>
                  <li>{t("sections.sharing.items.4")}</li>
                </ul>
                <p>{t("sections.sharing.note")}</p>
              </section>

              <section id="payments" className="scroll-mt-28">
                <h2>{t("sections.payments.title")}</h2>
                <p>{t("sections.payments.body")}</p>
              </section>

              <section id="security" className="scroll-mt-28">
                <h2>{t("sections.security.title")}</h2>
                <p>{t("sections.security.body")}</p>
              </section>

              <section id="retention" className="scroll-mt-28">
                <h2>{t("sections.retention.title")}</h2>
                <p>{t("sections.retention.body")}</p>
              </section>

              <section id="your-rights" className="scroll-mt-28">
                <h2>{t("sections.rights.title")}</h2>
                <p>{t("sections.rights.lead")}</p>
                <ul>
                  <li>{t("sections.rights.items.0")}</li>
                  <li>{t("sections.rights.items.1")}</li>
                  <li>{t("sections.rights.items.2")}</li>
                </ul>
              </section>

              <section id="children" className="scroll-mt-28">
                <h2>{t("sections.children.title")}</h2>
                <p>{t("sections.children.body")}</p>
              </section>

              <section id="international" className="scroll-mt-28">
                <h2>{t("sections.international.title")}</h2>
                <p>{t("sections.international.body")}</p>
              </section>

              <section id="contact" className="scroll-mt-28">
                <h2>{t("sections.contact.title")}</h2>
                <p>
                  {t("sections.contact.p1")}{" "}
                  <a href={`mailto:${t("contactEmail")}`}>{t("contactEmail")}</a>.
                </p>
                <p>
                  {t("sections.contact.p2")}{" "}
                  <Link href="/terms" className="font-semibold">
                    {t("sections.contact.termsLink")}
                  </Link>{" "}
                  {t("sections.contact.p3")}
                </p>
              </section>

              <section className="not-prose mt-14">
                <div className="rounded-2xl border border-neutral-200 bg-[#F7F7F5] p-8">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-neutral-900 mb-2">
                    {t("note.title")}
                  </p>
                  <p className="text-sm text-neutral-700 leading-relaxed">
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
