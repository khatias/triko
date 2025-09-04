import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Triko",
  description:
    "Triko is an online store offering a wide range of stylish clothing. Shop the latest trends and find your perfect fit!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
