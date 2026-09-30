import type { Metadata } from "next";

import PaymentsNav from "./_components/Paymentsnav";
import PaymentTerminal from "./_components/PaymentTerminal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Payments",
};

export default function PaymentsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Payments
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Take in-person payments with a QR code.</p>
        </div>
        <PaymentsNav />
      </header>

      <PaymentTerminal />
    </div>
  );
}