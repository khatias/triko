import React from 'react'
import SignUpForm from '@/components/auth/SignUpForm'
import { Section } from '@/components/UI/primitives'
function page() {
  return (
    <main className="overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      <Section className="rid place-items-center py-14">
        <div className="w-full max-w-lg">
    <SignUpForm/>
     </div>
      </Section>
</main>
  )
}

export default page