// app/robots.ts
import type { MetadataRoute } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { readIndex } from "@/lib/store";
import { readSiteSettings } from "@/lib/siteSettings.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function robots(): Promise<MetadataRoute.Robots> {
  noStore();

  const [s, articles] = await Promise.all([readSiteSettings(), readIndex()]);
  const site = s.url.replace(/\/+$/, "");

  // chemins des articles (ex: /articles/slug)
  const articlePaths = articles
    .map((a) => `/articles/${a.slug}`)
    // au cas où : unicité + tri pour un fichier stable
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/_next/static/",
          "/images/",
          ...articlePaths, // ⬅️ tous tes articles explicitement autorisés
        ],
        disallow: [
          "/admin",
          "/api/admin",
          "/api/preview",
          "/data/",
          "/*?edit=",
          "/*?page=",
        ],
      },
    ],
    // garde tes sitemaps si tu en as (c’est ce que les bots préfèrent)
    sitemap: [`${site}/sitemap.xml`],
    host: site,
  };
}
