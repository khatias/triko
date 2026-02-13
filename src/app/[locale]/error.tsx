// src/app/[locale]/error.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Section } from "@/components/UI/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  const pathname = usePathname();

  const locale = useMemo(() => {
    const seg = pathname?.split("/")?.[1];
    return seg === "ka" || seg === "en" ? seg : "en";
  }, [pathname]);

  const base = `/${locale}`;
  const isKa = locale === "ka";

  const isDev = process.env.NODE_ENV !== "production";

  const copy = {
    label: isKa ? "500 შეცდომა" : "500 Error",
    title: isKa ? "შეფერხება" : "Something went wrong",
    desc: isKa
      ? "გვერდის ჩატვირთვისას მოხდა გაუთვალისწინებელი შეცდომა. სცადე ხელახლა."
      : "We hit an unexpected issue while loading this page. Please try again. If it keeps happening, contact us.",
    debug: isKa ? "დეტალები (მხოლოდ dev)" : "Debug (dev only)",
    retry: isKa ? "თავიდან სცადე" : "Try again",
    home: isKa ? "მთავარი" : "Back Home",
    shop: isKa ? "მაღაზია" : "Shop",
  };

  return (
    <main className="flex w-full items-center justify-center bg-white py-16 dark:bg-zinc-950">
      <Section className="w-full">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* --- Image Side --- */}
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gray-50 shadow-sm dark:bg-zinc-900">
            <Image
              src="/error/error-cover.jpg"
              alt={isKa ? "შეცდომა" : "Something went wrong"}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* --- Content Side --- */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="font-mono text-sm font-bold uppercase tracking-widest text-orange-600">
                  {copy.label}
                </p>

                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                  {copy.title}
                </h1>
              </div>

              <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-600 dark:text-zinc-300 lg:mx-0">
                {copy.desc}
              </p>

              {/* Optional dev-only details */}
              {isDev ? (
                <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left text-sm text-gray-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 lg:mx-0">
                  <p className="mb-2 font-semibold">{copy.debug}</p>
                  <p className="wrap-break-word">{error?.message}</p>
                  {error?.digest ? (
                    <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
                      digest: {error.digest}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center lg:justify-start">
                <button
                  onClick={() => reset()}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-600 px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg active:scale-95"
                >
                  {copy.retry}
                </button>

                <Link
                  href={base}
                  className="group inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-sm font-semibold text-gray-700 transition-all hover:border-orange-500 hover:text-orange-600 active:scale-95 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                >
                  {copy.home}
                </Link>

                <Link
                  href={`${base}/products`}
                  className="group inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-sm font-semibold text-gray-700 transition-all hover:border-orange-500 hover:text-orange-600 active:scale-95 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200"
                >
                  {copy.shop}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
