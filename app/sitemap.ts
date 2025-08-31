// app/sitemap.ts
import type { MetadataRoute } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { readIndex } from "@/lib/store";
import { readSiteSettings } from "@/lib/siteSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  noStore();
  const [s, articles] = await Promise.all([readSiteSettings(), readIndex()]);
  const site = s.url.replace(/\/+$/, "");

  return [
    { url: site, changeFrequency: "weekly", priority: 0.8 },
    ...articles.map((a) => ({
      url: `${site}/articles/${a.slug}`,
      lastModified: a.date ? new Date(a.date) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
