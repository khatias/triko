import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Section } from "@/components/UI/primitives";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "ForgotPassword",
    path: "/forgot-password",
  });
}
function page() {
  return (
    <main className="overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      <Section className="rid place-items-center py-14">
        <div className="w-full max-w-lg">
          <ForgotPasswordForm />
        </div>
      </Section>
    </main>
  );
}

export default page;
