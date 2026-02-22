import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ChevronDown } from "lucide-react";

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

  return (
    <footer role="contentinfo" className="bg-white pt-10">
      {/* The "Elevated Sheet" look: 
        Massive rounded top corners, soft gray background, and a subtle inner shadow/border.
      */}
      <div className="bg-[#fcfcfc] rounded-t-[2.5rem] md:rounded-t-[3rem] border-t border-x border-neutral-200/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,1)] mx-2 md:mx-4 lg:mx-8 px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-8 transition-all">
        <div className="max-w-350 mx-auto">
          {/* =========================================
              TOP: NEWSLETTER "HERO"
              ========================================= */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-20 md:mb-28">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-4">
                {t("Newsletter.title") ?? "Let's stay in touch."}
              </h2>
              <p className="text-[16px] text-neutral-500 leading-relaxed max-w-md">
                {t("Newsletter.description") ?? "Subscribe to our newsletter for exclusive offers, early access to new collections, and styling tips."}
              </p>
            </div>

            {/* Premium Pill-Shaped Newsletter Input */}
            <form className="w-full lg:w-105 relative flex items-center bg-white rounded-full p-1.5 border border-neutral-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-600/10 transition-all duration-300">
              <input
                type="email"
                placeholder={t("Newsletter.placeholder") ?? "Enter your email"}
                className="flex-1 bg-transparent px-5 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-400 outline-none w-full"
                required
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="group flex items-center justify-center gap-2 h-12 px-6 bg-neutral-900 hover:bg-rose-600 text-white font-semibold text-[14px] rounded-full transition-all duration-300 shadow-sm"
              >
                <span>{t("Newsletter.button") ?? "Subscribe"}</span>
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
                  className="text-[13px] font-bold text-neutral-900 mb-6"
                >
                  {title}
                </h3>
                <ul className="space-y-1.5 flex flex-col items-start">
                  {links.map(({ label, href }) => (
                    <li key={href} className="w-full">
                      <Link
                        prefetch={false}
                        href={href}
                        // "Stripe-style" Pill Hover Effect
                        className="relative block w-full px-3 py-2 -ml-3 text-[14px] font-medium text-neutral-500 rounded-lg transition-all duration-200 hover:bg-neutral-200/50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:bg-neutral-200/50"
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
              <h3 className="text-[13px] font-bold text-neutral-900 mb-6">
                {t("brand.storeTitle") ?? "Stores"}
              </h3>
              <div className="text-[14px] font-medium text-neutral-500 px-3 -ml-3">
                <StoreLocations locale={locale} t={t} />
              </div>
            </section>
          </div>

          {/* Mobile Accordion (Ultra-Clean, No Borders) */}
          <div className="md:hidden flex flex-col gap-2">
            {sections.map(({ title, links }) => (
              <details
                key={title}
                className="group bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden outline-none">
                  <span className="text-[14px] font-bold text-neutral-900">
                    {title}
                  </span>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-neutral-50 group-open:bg-rose-50 transition-colors duration-300">
                    <ChevronDown
                      className="h-4 w-4 text-neutral-500 group-open:text-rose-600 transition-transform duration-300 group-open:-rotate-180"
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
                        className="text-[14px] font-medium text-neutral-500 hover:text-rose-600 transition-colors block py-1"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <section
              className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 mt-2"
              aria-label={t("brand.storesAria") ?? "Store Locations"}
            >
              <h3 className="text-[14px] font-bold text-neutral-900 mb-3">
                {t("brand.storeTitle") ?? "Stores"}
              </h3>
              <div className="text-[14px] font-medium text-neutral-500">
                <StoreLocations locale={locale} t={t} />
              </div>
            </section>
          </div>

          {/* =========================================
              BOTTOM: SLEEK DIVIDER & COPYRIGHT
              ========================================= */}
          <div className="mt-16 md:mt-24 pt-8 border-t border-neutral-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-black tracking-tight text-neutral-900">
                TRIKO.
              </span>
              <span className="h-4 w-px bg-neutral-300 hidden md:block" />
              <p className="text-[13px] font-medium text-neutral-400">
                © {year} {t("legal.allRights") ?? "All rights reserved."}
              </p>
            </div>

            {/* Social Icons inside a sleek floating pill */}
            <div className="flex justify-center bg-white border border-neutral-200/80 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow duration-300">
              <SocialMedia />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
