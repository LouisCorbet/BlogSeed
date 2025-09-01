// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { readSiteSettings } from "@/lib/siteSettings";
import GAReporter from "./components/GAReporter";
import ConsentBanner from "./components/ConsentBanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  };
}
const ADS_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.GA_MEASUREMENT_ID || // au cas où tu utilises un autre nom
  "";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await readSiteSettings();
  const theme = s.theme ?? "light";
  console.log("okok : ", GA_ID);

  return (
    <html lang="fr" data-theme={theme}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        {/* Consent Mode par défaut (doit être AVANT gtag.js et dans <head> idéalement) */}
        <Script id="consent-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied'
            });
          `}
        </Script>

        {/* --- Google Analytics (dans le HEAD) --- */}
        {process.env.NODE_ENV === "production" && GA_ID && (
          <>
            <Script
              id="gtag-lib"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="beforeInteractive" // <- injecté dans le head
            />
            <Script id="ga-init" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                // pas de page_view auto : on laisse GAReporter/routeur gérer
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        )}

        <Header />
        <ConsentBanner />
        <main className="flex-1 bg-base-200">{children}</main>
        <Footer />

        {/* GAReporter peut rester tel quel (il n'a pas besoin de l'ID) */}
        {process.env.NODE_ENV === "production" && GA_ID && <GAReporter />}

        {/* AdSense inchangé */}
        {process.env.NODE_ENV === "production" && ADS_CLIENT && (
          <Script
            id="adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
