import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://grainbuds.de"),
  title: {
    default: "Grainbuds",
    template: "%s — Grainbuds",
  },
  description:
    "Grainbuds in Erlangen: Matcha, Boba und Sushi. Online zur Abholung oder zum Essen vor Ort bestellen.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    siteName: "Grainbuds",
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
