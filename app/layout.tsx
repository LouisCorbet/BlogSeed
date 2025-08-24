// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { readSiteSettings } from "@/lib/siteSettings";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await readSiteSettings();
  const siteUrl = s.url.replace(/\/+$/, "");
  const abs = (p: string) => new URL(p, siteUrl).toString();

  return {
    title: { default: s.name, template: `%s — ${s.name}` },
    description: s.tagline,
    alternates: { canonical: siteUrl },

    // Favicons dynamiques
    icons: {
      icon: s.favicon ? [{ url: s.favicon }] : undefined,
      shortcut: s.favicon ? [{ url: s.favicon }] : undefined,
      apple: s.favicon ? [{ url: s.favicon }] : undefined,
      other: s.favicon
        ? [{ rel: "mask-icon", url: s.favicon, color: "#000000" }]
        : undefined,
    },

    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: s.name,
      title: s.name,
      description: s.tagline,
      images: [
        { url: abs(s.defaultOg), width: 1200, height: 630, alt: s.name },
      ],
      locale: "fr_FR",
    },

    // twitter: {
    //   card: "summary_large_image",
    //   title: s.name,
    //   description: s.tagline,
    //   images: [abs(s.defaultOg)],
    //   site: s.twitter, // ex: "@monsite"
    // },

    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1 bg-base-200">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
