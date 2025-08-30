// app/page.tsx
import Image from "next/image";
import type { Metadata } from "next";
import { readIndex } from "@/lib/store";
import { readSiteSettings } from "@/lib/siteSettings";
import ArticleSearch from "./components/ArticlesSearch";

// --- Metadatas dynamiques depuis siteSettings ---
export async function generateMetadata(): Promise<Metadata> {
  const s = await readSiteSettings();
  const siteUrl = s.url.replace(/\/+$/, "");
  const abs = (p: string) => new URL(p, siteUrl).toString();

  return {
    title: {
      default: s.name,
      template: s.titleTemplate,
    },
    description: s.tagline,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      type: "website",
      url: siteUrl,
      siteName: s.name,
      title: s.name,
      description: s.tagline,
      images: [
        {
          url: abs(s.defaultOg),
          width: 1200,
          height: 630,
          alt: s.name,
        },
      ],
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

// JSON-LD WebSite (dépend aussi des settings)
function HomeJsonLd({ name, url }: { name: string; url: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url.replace(/\/+$/, "")}/?q={search_term_string}`,
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
  const [all, s] = await Promise.all([readIndex(), readSiteSettings()]);

  return (
    <main className="min-h-screen bg-base-200">
      {/* JSON-LD pour la page d’accueil */}
      <HomeJsonLd name={s.name} url={s.url} />

      {/* Hero */}
      <section className="bg-base-100 hero border-b border-base-300">
        <div className="hero-content max-w-5xl w-full flex-col lg:flex-row gap-10 py-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              {s.name}
            </h1>
            <p className="py-4 text-base-content/70">{s.tagline}</p>
          </div>

          {/* Visuel : on réutilise l’OG par défaut comme vignette (fallback favicon) */}
          <Image
            src={s.homeLogo || "/favicon.ico"}
            alt={`${s.name} — visuel`}
            width={200}
            height={200}
            className="rounded-xl border border-base-300 object-cover"
            priority
          />
        </div>
      </section>

      {/* 🔎 Section Recherche + Liste filtrée */}
      <ArticleSearch items={all} />
    </main>
  );
}
