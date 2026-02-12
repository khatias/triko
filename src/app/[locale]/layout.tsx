// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Montserrat, Noto_Sans_Georgian } from "next/font/google";
import Header from "@/components/Header/Header";
import Footer from "@/components/footer/Footer";
import Banner from "@/components/Header/Banner";
import { Toaster } from "sonner";
import PublicOnly from "@/components/PublicOnly";
import "../globals.css";

type Locale = "ka" | "en";

type Props = {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-sans-georgian",
  subsets: ["georgian"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

function assertLocale(locale: string): asserts locale is Locale {
  if (!routing.locales.includes(locale as Locale)) notFound();
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string } | Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await Promise.resolve(params);
  assertLocale(locale);

  const t = await getTranslations({ locale, namespace: "Home" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    icons: { icon: "/favicon-v4.ico" },
    // Optional (recommended for absolute URLs in OG tags):
    // metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://triko.ge"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await Promise.resolve(params);
  assertLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${notoSansGeorgian.variable} ${montserrat.variable} antialiased bg-white text-zinc-900`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PublicOnly>
            <Banner />
            {/* <Header locale={locale} /> */}
          </PublicOnly>

          {children}

          <Toaster richColors position="top-right" />

          <PublicOnly>
            <Footer />
          </PublicOnly>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
