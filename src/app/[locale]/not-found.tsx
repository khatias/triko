// src/app/[locale]/not-found.tsx
import Link from "next/link";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { Section } from "../../components/UI/primitives";

export default async function NotFound() {
  const locale = await getLocale();
  const base = `/${locale}`;
  const isKa = locale === "ka";

  return (
    <main className="flex w-full items-center justify-center bg-white py-16">
      <Section className="w-full">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          
          {/* --- Image Side --- */}
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gray-50 shadow-sm">
            <Image
              src="/error/error-cover.jpg"
              alt="Page not found"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* --- Content Side --- */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <div className="space-y-6">
              
              {/* Text Block */}
              <div className="space-y-3">
                {/* 404 Label - Now matches your Orange brand color */}
                <p className="font-mono text-sm font-bold uppercase tracking-widest text-orange-600">
                  404 Error
                </p>
                
                {/* Main Heading - Darker and sharper (Gray-900) */}
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  {isKa ? "გვერდი ვერ მოიძებნა" : "Page not found"}
                </h1>
              </div>

              {/* Description - Darker gray for better readability (Gray-600) */}
              <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-600 lg:mx-0">
                {isKa
                  ? "სამწუხაროდ, გვერდი რომელსაც ეძებთ ვერ მოიძებნა. შესაძლოა ბმული მოძველებულია ან გვერდი წაიშალა."
                  : "Sorry, we couldn’t find the page you’re looking for. It might have been moved, deleted, or never existed."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center lg:justify-start">
                
                {/* Primary: Orange Background */}
                <Link
                  href={base}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-600 px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg active:scale-95"
                >
                  {isKa ? "მთავარი" : "Back Home"}
                </Link>

                {/* Secondary: Gray Border -> Orange on Hover */}
                {/* This looks much cleaner than a permanent orange border */}
                <Link
                  href={`${base}/shop`}
                  className="group inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-sm font-semibold text-gray-700 transition-all hover:border-orange-500 hover:text-orange-600 active:scale-95"
                >
                  {isKa ? "მაღაზია" : "Visit Shop"}
                </Link>
              </div>
            </div>
          </div>
          
        </div>
      </Section>
    </main>
  );
}