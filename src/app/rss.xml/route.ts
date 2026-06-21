import { prisma } from "@/lib/prisma";
import { absoluteUrl, getBaseUrl } from "@/lib/site-url";
import { getSettings, getIntSetting, SETTING_KEYS } from "@/lib/settings";
import { publishedArticleWhere } from "@/lib/queries";

/**
 * Flux RSS dynamique servi à /rss.xml.
 * Nombre d'items configurable depuis l'admin (clé rss.itemCount, défaut 20).
 */

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [settings, itemCount] = await Promise.all([
    getSettings([SETTING_KEYS.BLOG_TITLE, SETTING_KEYS.BLOG_DESCRIPTION]),
    getIntSetting(SETTING_KEYS.RSS_ITEM_COUNT, 20),
  ]);

  const blogTitle = settings[SETTING_KEYS.BLOG_TITLE] ?? "Mon Blog";
  const blogDescription = settings[SETTING_KEYS.BLOG_DESCRIPTION] ?? "";
  const baseUrl = getBaseUrl();

  const articles = await prisma.article.findMany({
    where: publishedArticleWhere(),
    select: { title: true, slug: true, excerpt: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: Math.max(1, itemCount),
  });

  const items = articles
    .map((a) => {
      const link = absoluteUrl(`/article/${a.slug}`);
      const pubDate = a.publishedAt?.toUTCString() ?? new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${a.excerpt ? `<description>${escapeXml(a.excerpt)}</description>` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blogTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(blogDescription)}</description>
    <language>fr</language>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
