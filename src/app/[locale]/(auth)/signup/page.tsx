import React from "react";
import SignUpForm from "@/components/auth/SignUpForm";
import { Section } from "@/components/UI/primitives";
import { generateLocalizedMetadata } from "@/utils/metadata/generateMetadata";
export async function generateMetadata(ctx: {
  params: Promise<{ locale: string }>;
}) {
  return generateLocalizedMetadata(ctx, {
    namespace: "SignUp",
    path: "/signup",
  });
}
function page() {
  return (
    <main className="overflow-hidden bg-linear-to-b from-zinc-50 to-white">
      <Section className="rid place-items-center py-14">
        <div className="w-full max-w-lg">
          <SignUpForm />
        </div>
      </Section>
    </main>
  );
}

export default page;
