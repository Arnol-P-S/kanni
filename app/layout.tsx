import type { Metadata } from "next";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans-malayalam/400.css";
import "@fontsource/noto-sans-malayalam/600.css";
import "@fontsource/noto-sans-malayalam/700.css";
import "./globals.css";

import { getRequestLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "Kanni | കണ്ണി",
    template: "%s | Kanni",
  },
  description:
    "Kanni connects students, teachers, parents, and school leaders around the next useful learning step.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
