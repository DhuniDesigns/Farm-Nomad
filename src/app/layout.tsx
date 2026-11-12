import type { Metadata, Viewport } from "next";
import { outfit, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmNomad | Food straight from UK farms",
  description:
    "FarmNomad connects UK farmers with customers, kitchens and community food groups, with delivery built in. List once, sell more, waste less.",
  openGraph: {
    title: "FarmNomad | Food straight from UK farms",
    description: "List once, sell more, waste less. A marketplace and delivery network for UK growers.",
    images: ["/images/hero.webp"],
    locale: "en_GB",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#10251B",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${outfit.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@200,300,400,500,600,700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
