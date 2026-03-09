import React from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
import { Section } from "@/components/UI/primitives";
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "ResetPassword",
    path: "/reset-password",
  });
}

export default function page() {
  return (
    <main className="relative overflow-hidden bg-linear-to-b from-zinc-50 to-white">
      <Section className="grid place-items-center py-14">
        <div className="w-full max-w-lg">
          <ResetPasswordForm />
        </div>
      </Section>
    </main>
  );
}
