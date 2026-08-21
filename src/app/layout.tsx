import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
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
    "A calm corner in Erlangen for matcha, boba, and sushi. Order online for pickup at Grainbuds, Universitätsstraße 7.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    siteName: "Grainbuds",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
