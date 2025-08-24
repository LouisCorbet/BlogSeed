// lib/seo.ts
import type { Metadata } from "next";
import { readSiteSettings } from "./siteSettings";

// Types côté contenu (adapte-les à ton store)
export type ArticleMeta = {
  slug: string;
  title: string;
  author?: string;
  date?: string; // ISO
  catchphrase?: string; // description courte si dispo
  imgPath?: string; // ex: "uploads/cover.webp"
  imageAlt?: string;
  draft?: boolean; // pour noindex
  html?: string; // contenu complet si tu l'as déjà
};

const site = await readSiteSettings();

const abs = (path: string | undefined) =>
  path ? new URL(path, site.url).toString() : undefined;

export function excerptFromHtml(html?: string, fallback = ""): string {
  if (!html) return fallback;
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (text || fallback).slice(0, 160);
}

export function buildArticleMetadata(a: ArticleMeta): Metadata {
  const url = abs(`/articles/${a.slug}`);
  const ogImage = abs(
    a.imgPath ? `/${a.imgPath.replace(/^\//, "")}` : site.defaultOg
  );
  const description = a.catchphrase || excerptFromHtml(a.html, a.title);

  return {
    // Titre + template
    title: {
      default: a.title,
      template: site.titleTemplate,
    },
    description,

    // Canonical / hreflang basique
    alternates: {
      canonical: url,
      // Si tu gères plusieurs langues, ajoute-les ici
      // languages: { fr: url! , en: abs(`/en/articles/${a.slug}`)! }
    },

    // Open Graph
    openGraph: {
      type: "article",
      title: a.title,
      description,
      url,
      siteName: site.name,
      locale: site.localeDefault,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: a.imageAlt || a.title,
            },
          ]
        : undefined,
    },

    // Twitter Card
    // twitter: {
    //   card: "summary_large_image",
    //   title: a.title,
    //   description,
    //   site: site.twitter,
    //   images: ogImage ? [ogImage] : undefined,
    // },

    // Robots (noindex si brouillon)
    robots: a.draft
      ? {
          index: false,
          follow: false,
          noimageindex: true,
          nocache: true,
        }
      : {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
          "max-video-preview": -1,
        },
  };
}

// Composant JSON-LD (Article)
export function ArticleJsonLd({ a }: { a: ArticleMeta }) {
  const url = abs(`/articles/${a.slug}`);
  const img = abs(
    a.imgPath ? `/${a.imgPath.replace(/^\//, "")}` : site.defaultOg
  );
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.catchphrase || excerptFromHtml(a.html || ""),
    mainEntityOfPage: url,
    image: img ? [img] : undefined,
    datePublished: a.date,
    author: a.author ? { "@type": "Person", name: a.author } : undefined,
    publisher: { "@type": "Organization", name: site.name },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
