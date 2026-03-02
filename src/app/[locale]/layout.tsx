// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header/Header";
import Footer from "@/components/footer/Footer";
import { Noto_Sans_Georgian } from "next/font/google";
import { Toaster } from "sonner";
import PublicOnly from "@/components/PublicOnly";
import "../globals.css";

type Locale = "ka" | "en";

type Props = {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};

const noto = Noto_Sans_Georgian({
  subsets: ["latin", "georgian"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await Promise.resolve(params);
  assertLocale(locale);

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${noto.className} antialiased bg-white text-zinc-900`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PublicOnly>
            <Header locale={locale} />
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