import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import { Section } from "@/components/UI/primitives";

export default function page() {
  return (
    <main className="overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      <Section className="rid place-items-center py-14">
        <div className="w-full max-w-lg">
          <LoginForm />
        </div>
      </Section>
    </main>
  );
}

