import type { Metadata } from "next";

import PaymentRecords from "../_components/PaymentRecords";
import PaymentsNav from "../_components/Paymentsnav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Payment records",
};

export default function PaymentRecordsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Payment records
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every sale, its status, and anything that needs a manager&apos;s
            check.
          </p>
        </div>
        <PaymentsNav />
      </header>

      <PaymentRecords />
    </div>
  );
}
