import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown, Phone } from "lucide-react";

import SocialMedia from "../socialMedia/SocialMedia";
import StoreLocations from "../locations/StoreLocations";

export default async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  const withLocale = (path: string) =>
    `/${locale}${path.startsWith("/") ? path : `/${path}`}`;

  const footerNav = {
    help: {
      title: t("nav.help") ?? "Help",
      links: [
        { label: t("links.about"), href: withLocale("/aboutUs") },
        { label: t("links.contact"), href: withLocale("/contact") },
        { label: t("links.shipping"), href: withLocale("/shipping-policy") },
      ],
    },
    orders: {
      title: t("nav.orders") ?? "Orders & Returns",
      links: [
        {
          label: t("links.orderStatus") ?? "Order Status",
          href: withLocale("/profile/orders"),
        },
        {
          label: t("links.returns") ?? "Returns & Exchanges",
          href: withLocale("/exchange-policy"),
        },
      ],
    },
    legal: {
      title: t("nav.legal") ?? "Legal",
      links: [
        { label: t("links.privacy"), href: withLocale("/privacy") },
        { label: t("links.terms"), href: withLocale("/terms") },
      ],
    },
  } as const;

  const sections = [footerNav.help, footerNav.orders, footerNav.legal];
  const idFrom = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // ✅ phone config (single source of truth)
  const phoneNumber = "+995 593 49 11 44";
  const phoneHref = "tel:+995593491144";

  return (
    <footer role="contentinfo" className="bg-white pt-10">
      <div className="bg-orange-300 text-stone-900 rounded-t-[2.5rem] md:rounded-t-[3rem] border-t border-x border-orange-400/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)] mx-2 md:mx-4 lg:mx-8 px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-8 transition-all">
        <div className="max-w-350 mx-auto">
          {/* =========================================
              TOP: NEWSLETTER "HERO"
              ========================================= */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-20 md:mb-28">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 mb-4">
                {t("Newsletter.title")}
              </h2>
              <p className="text-[16px] text-stone-700 leading-relaxed max-w-md">
                {t("Newsletter.description")}
              </p>
            </div>

            {/* Premium Pill-Shaped Newsletter Input */}
            <form className="w-full lg:w-105 relative flex items-center bg-white/95 rounded-full p-1.5 border border-orange-400/30 shadow-sm focus-within:border-stone-900 focus-within:ring-4 focus-within:ring-stone-900/10 transition-all duration-300">
              <input
                type="email"
                placeholder={t("Newsletter.placeholder") ?? "Enter your email"}
                className="flex-1 bg-transparent px-5 py-3 text-[15px] text-stone-900 placeholder:text-stone-500 outline-none w-full"
                required
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="group flex items-center justify-center gap-2 h-12 px-6 bg-stone-900 hover:bg-stone-800 text-orange-50 font-semibold text-[14px] rounded-full transition-all duration-300 shadow-sm"
              >
                <span>{t("Newsletter.button") ?? "Subscribe"}</span>
                <ArrowRight
                  className="h-4 w-4 text-orange-50 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </button>
            </form>
          </div>

          {/* =========================================
              MIDDLE: NAVIGATION GRID
              ========================================= */}
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-4 gap-12 lg:gap-16">
            {sections.map(({ title, links }) => (
              <nav key={title} aria-labelledby={`footer-${idFrom(title)}`}>
                <h3
                  id={`footer-${idFrom(title)}`}
                  className="text-[13px] font-bold text-stone-900 mb-6"
                >
                  {title}
                </h3>
                <ul className="space-y-1.5 flex flex-col items-start">
                  {links.map(({ label, href }) => (
                    <li key={href} className="w-full">
                      <Link
                        prefetch={false}
                        href={href}
                        className="relative block w-full px-3 py-2 -ml-3 text-[14px] font-medium text-stone-700 rounded-lg transition-all duration-200 hover:bg-orange-400/30 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:bg-orange-400/30"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* Stores Column */}
            <section aria-label={t("brand.storesAria") ?? "Store Locations"}>
              <h3 className="text-[13px] font-bold text-stone-900 mb-6">
                {t("brand.storeTitle") ?? "Stores"}
              </h3>
              <div className="text-[14px] font-medium text-stone-700 px-3 -ml-3">
                <StoreLocations locale={locale} t={t} />
              </div>
            </section>
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden flex flex-col gap-2">
            {sections.map(({ title, links }) => (
              <details
                key={title}
                className="group bg-orange-200/50 rounded-2xl border border-orange-400/40 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                  <span className="text-[14px] font-bold text-stone-900">
                    {title}
                  </span>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-300 group-open:bg-stone-900 transition-colors duration-300">
                    <ChevronDown
                      className="h-4 w-4 text-stone-800 group-open:text-orange-50 transition-transform duration-300 group-open:-rotate-180"
                      strokeWidth={2.5}
                    />
                  </div>
                </summary>
                <ul className="px-5 pb-5 space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        prefetch={false}
                        href={href}
                        className="text-[14px] font-medium text-stone-700 hover:text-stone-900 transition-colors block py-1"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <section
              className="bg-orange-200/50 rounded-2xl border border-orange-400/40 p-5 mt-2"
              aria-label={t("brand.storesAria") ?? "Store Locations"}
            >
              <h3 className="text-[14px] font-bold text-stone-900 mb-3">
                {t("brand.storeTitle") ?? "Stores"}
              </h3>
              <div className="text-[14px] font-medium text-stone-700">
                <StoreLocations locale={locale} t={t} />
              </div>
            </section>
          </div>

          {/* =========================================
              BOTTOM: DIVIDER & COPYRIGHT
              ========================================= */}
          <div className="mt-16 md:mt-24 pt-8 border-t border-orange-400/50 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Brand + Copyright */}
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-black tracking-tight text-stone-900">
                TRIKO.
              </span>
              <span className="h-4 w-px bg-orange-400/80 hidden md:block" />
              <p className="text-[13px] font-medium text-stone-700">
                © {year} {t("legal.allRights") ?? "All rights reserved."}
              </p>
            </div>

            {/* Right: Phone pill + Social pill */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={phoneHref}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-orange-400/40 px-4 py-3 text-[13px] font-semibold text-stone-900 shadow-sm hover:shadow-md transition-shadow"
                aria-label={t("contact.callAria") ?? "Call us"}
              >
                <Phone className="h-4 w-4 text-stone-700" />
                <span className="text-stone-700">
                  {t("contact.call") ?? "Call"}
                </span>
                <span className="h-4 w-px bg-orange-400/60" />
                <span>{phoneNumber}</span>
              </a>

              <div className="flex justify-center bg-white/90 border border-orange-400/40 text-stone-900 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow duration-300">
                <SocialMedia />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
