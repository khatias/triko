import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Montserrat, Noto_Sans_Georgian } from "next/font/google";
import Header from "@/components/Header/Header";
import "../globals.css";
import { Toaster } from "sonner";
import Footer from "@/components/footer/Footer";
import Banner from "@/components/Header/Banner";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-sans-georgian",
  subsets: ["georgian"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await Promise.resolve(params);

  if (!routing.locales.includes(locale as "en" | "ka")) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className={`${notoSansGeorgian.variable} ${montserrat.variable} `}>
        <Banner />
        <Header locale={locale as "ka" | "en"} />
        {children}
        <Toaster richColors position="top-right" />
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
