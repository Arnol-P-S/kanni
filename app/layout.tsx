import type { Metadata } from "next";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans-malayalam/400.css";
import "@fontsource/noto-sans-malayalam/600.css";
import "@fontsource/noto-sans-malayalam/700.css";
import "./globals.css";

import { LearningRecordProvider } from "@/components/learning-record-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "Kanni | കണ്ണി",
    template: "%s | Kanni",
  },
  description:
    "One learning moment becomes useful to a Kerala student, teacher, and parent.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LearningRecordProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </LearningRecordProvider>
      </body>
    </html>
  );
}
