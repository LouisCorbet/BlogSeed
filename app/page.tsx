// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { readIndex } from "@/lib/store";
import ArticleSearch from "./components/ArticlesSearch";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";
const OG_IMAGE = new URL("/og-default.jpg", SITE_URL).toString(); // mets ton image OG

export const metadata: Metadata = {
  title: {
    default: "Mon Blog",
    template: "%s — Mon Blog",
  },
  description:
    "Derniers articles, guides et inspirations. Léger, rapide et SEO-friendly : tutoriels, bonnes pratiques et ressources.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Mon Blog",
    title: "Mon Blog",
    description:
      "Guides, articles et inspirations. Performance, accessibilité et SEO à l’honneur.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Mon Blog" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mon Blog",
    description:
      "Guides, articles et inspirations. Performance, accessibilité et SEO.",
    images: [OG_IMAGE],
    // site: "@toncompte", // ajoute si tu as un Twitter/X
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

function HomeJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Mon Blog",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

export default async function Home() {
  const all = await readIndex();

  return (
    <main className="min-h-screen bg-base-200">
      {/* JSON-LD pour la page d’accueil */}
      <HomeJsonLd />

      {/* Hero */}
      <section className="bg-base-100 hero border-b border-base-300">
        <div className="hero-content max-w-5xl w-full flex-col lg:flex-row gap-10 py-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Mon <span className="text-primary">Blog</span>
            </h1>
            <p className="py-4 text-base-content/70">
              Derniers articles, guides et inspirations. Tout est servi léger,
              rapide, et SEO-friendly.
            </p>
            <Link href="/articles" className="link link-primary">
              Parcourir les articles →
            </Link>
          </div>
          <Image src="/favicon.ico" alt="Hero Image" width={200} height={200} />
        </div>
      </section>

      {/* 🔎 Section Recherche + Liste filtrée */}
      <ArticleSearch items={all} />
    </main>
  );
}
