import React from "react";
import Image from "next/image";
import ContactForm from "@/components/contact/ContactForm";
import beautImage from "../../../assets/cotactCover.jpeg";

export default function Page() {
  return (
    <main className="min-h-screen bg-[linear-gradient(to_bottom,#f3f3f3_45%,#ffffff_30%)]">
      <div className="container mx-auto flex items-center px-4 md:px-8 lg:px-16 xl:px-20 2xl:px-32 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2">
          {/* Image side */}
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-md lg:max-w-lg">
              <Image
                src={beautImage}
                alt="Contact illustration"
                width={900}
                height={900}
                priority
                sizes="(min-width:1024px) 50vw, 100vw"
                className="hidden lg:block h-auto w-full rounded-3xl object-cover shadow-lg ring-1 ring-black/10 transition-transform duration-500 hover:scale-[1.01]"
              />
            </div>
          </div>

          {/* Form side */}
          <div className="order-1 lg:order-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
