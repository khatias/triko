// src/app/[locale]/error.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Section } from "@/components/UI/primitives";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: replace with your logger/Sentry later
    console.error("Route error:", error);
  }, [error]);

  // Try to keep UI user friendly in prod
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="flex w-full items-center justify-center bg-white py-16">
      <Section className="w-full">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* --- Image Side --- */}
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-gray-50 shadow-sm">
            <Image
              src="/error/error-cover.jpg"
              alt="Something went wrong"
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
                  500 Error
                </p>

                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  Something went wrong
                </h1>
              </div>

              <p className="mx-auto max-w-md text-lg leading-relaxed text-gray-600 lg:mx-0">
                We hit an unexpected issue while loading this page. Please try
                again. If it keeps happening, contact us.
              </p>

              {/* Optional dev-only details */}
              {isDev ? (
                <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left text-sm text-gray-700 lg:mx-0">
                  <p className="mb-2 font-semibold">Debug (dev only)</p>
                  <p className="break-words">{error?.message}</p>
                  {error?.digest ? (
                    <p className="mt-2 text-xs text-gray-500">
                      digest: {error.digest}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center lg:justify-start">
                {/* Primary: Retry */}
                <button
                  onClick={() => reset()}
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-orange-600 px-8 text-sm font-semibold text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg active:scale-95"
                >
                  Try again
                </button>

                {/* Secondary: Back Home */}
                <Link
                  href="/"
                  className="group inline-flex h-12 items-center justify-center rounded-xl border border-gray-200 bg-white px-8 text-sm font-semibold text-gray-700 transition-all hover:border-orange-500 hover:text-orange-600 active:scale-95"
                >
                  Back Home
                </Link>
              </div>

              <p className="text-sm text-gray-500">
                Tip: Refreshing usually fixes temporary issues.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
