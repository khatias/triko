import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import { Section } from "@/components/UI/primitives";
function page() {
  return (
    <main>
      <Section>
        <LoginForm />
      </Section>
    </main>
  );
}

export default page;
