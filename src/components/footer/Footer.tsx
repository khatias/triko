import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import SocialMedia from "../socialMedia/SocialMedia";
import StoreLocations from "../locations/StoreLocations";
import { linkCls, headCls } from "../UI/primitives";
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
        { label: t("links.shipping"), href: withLocale("/shipping-returns") },
        { label: t("links.sizeGuide"), href: withLocale("/size-guide") },
        { label: t("links.faq"), href: withLocale("/faq") },
      ],
    },
    orders: {
      title: t("nav.orders") ?? "Orders & Returns",
      links: [
        {
          label: t("links.orderStatus") ?? "Order Status",
          href: withLocale("/orders"),
        },
        {
          label: t("links.shipping") ?? "Shipping Information",
          href: withLocale("/shipping-returns"),
        },
        {
          label: t("links.returns") ?? "Returns & Exchanges",
          href: withLocale("/shipping-returns#returns"),
        },
        {
          label: t("links.trackOrder") ?? "Track Your Order",
          href: withLocale("/orders/track"),
        },
      ],
    },
    services: {
      title: t("nav.services") ?? "Services",
      links: [
        {
          label: t("links.giftCards") ?? "Gift Cards",
          href: withLocale("/gift-cards"),
        },
        {
          label: t("links.offers") ?? "Offers & Events",
          href: withLocale("/offers"),
        },
        {
          label: t("links.contact") ?? "Contact Us",
          href: withLocale("/contact"),
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

  const sections = [
    footerNav.help,
    footerNav.orders,
    footerNav.services,
  ] as const;
  const idFrom = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <footer
      role="contentinfo"
      className="mt-20  bg-gradient-to-b from-[#fafafa] to-white text-zinc-700"
    >
      <div />

      <div className="container mx-auto px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32">
        <div className="hidden md:grid py-14 md:grid-cols-4 gap-x-10 gap-y-8">
          {sections.map(({ title, links }) => (
            <nav
              key={title}
              aria-labelledby={`footer-${idFrom(title)}`}
              className="min-w-0"
            >
              <h3 className={headCls} id={`footer-${idFrom(title)}`}>
                {title}{" "}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link prefetch={false} href={href} className={linkCls}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <section
            aria-label={t("brand.storesAria") ?? "Store Locations"}
            className="min-w-0"
          >
            <h3 className={headCls}>{t("brand.storeTitle") ?? "Stores"}</h3>
            <div className="mt-5">
              <StoreLocations locale={locale} t={t} />
            </div>
          </section>
        </div>

        <div className="md:hidden py-10">
          <section
            aria-label={t("brand.storesAria") ?? "Store Locations"}
            className="mb-6"
          >
            <h3 className={headCls}>{t("brand.storeTitle") ?? "Stores"}</h3>
            <div className="mt-4">
              <StoreLocations locale={locale} t={t} />
            </div>
          </section>

          <div className="rounded-2xl border border-zinc-200/80 overflow-hidden">
            {sections.map(({ title, links }, idx) => (
              <details key={title} className="group">
                <summary
                  className={[
                    "flex items-center justify-between px-4 py-4 cursor-pointer select-none",
                    ,
                    "[&::-webkit-details-marker]:hidden",
                    idx !== 0 ? "border-t border-zinc-200/70" : "",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdd5a2]/50",
                    headCls,
                  ].join(" ")}
                >
                  <span>{title}</span>
                  {/* plus/minus icon (CSS only) */}
                  <span aria-hidden className="relative ml-3 h-5 w-5">
                    <span className="absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 transition-opacity group-open:opacity-0" />
                    <span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 bg-zinc-900" />
                  </span>
                </summary>

                <ul className="px-4 pb-4 space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={href}>
                      <Link prefetch={false} href={href} className={linkCls}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* ===== Bottom bar ===== */}
        <div className="border-t border-zinc-200 py-6">
          <div className="grid gap-4 sm:grid-cols-3 sm:items-center">
            <p className="text-center sm:text-left text-[12px] leading-5 text-zinc-500">
              © {year} Triko. {t("legal.allRights")}
            </p>

            <ul
              aria-label={footerNav.legal.title}
              className="order-3 sm:order-none flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] leading-5 text-zinc-500"
            >
              {footerNav.legal.links.map(({ label, href }, i) => (
                <li key={href} className="flex items-center">
                  {i > 0 && <span className="px-2 text-zinc-300">·</span>}
                  <Link
                    prefetch={false}
                    href={href}
                    className="hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fdd5a2]/50 rounded"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex justify-center sm:justify-end">
              {/* Give icons a bit of breathing room without forcing their own styles */}
              <div className="inline-flex items-center gap-3 rounded-full px-2 py-1">
                <SocialMedia />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
