import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site-url";
import { publishedArticleWhere, publishedQuizWhere } from "@/lib/queries";

/**
 * sitemap.xml dynamique. Next.js sert ce fichier à /sitemap.xml.
 * Inclut : accueil, articles publiés, quizz publiés, pages, catégories,
 * tags et auteurs ayant au moins un article publié.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, quizzes, pages, categories, tags, authors] = await Promise.all([
    prisma.article.findMany({
      where: publishedArticleWhere(),
      select: { slug: true, updatedAt: true },
    }),
    prisma.quiz.findMany({
      where: publishedQuizWhere(),
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({
      where: { articles: { some: publishedArticleWhere() } },
      select: { slug: true },
    }),
    prisma.tag.findMany({
      where: { articles: { some: { article: publishedArticleWhere() } } },
      select: { slug: true },
    }),
    prisma.user.findMany({
      where: { slug: { not: null }, articles: { some: publishedArticleWhere() } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/quiz"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/produits"), changeFrequency: "weekly", priority: 0.5 },
  ];

  for (const a of articles) {
    entries.push({ url: absoluteUrl(`/article/${a.slug}`), lastModified: a.updatedAt, changeFrequency: "weekly", priority: 0.8 });
  }
  for (const q of quizzes) {
    entries.push({ url: absoluteUrl(`/quiz/${q.slug}`), lastModified: q.updatedAt, changeFrequency: "monthly", priority: 0.6 });
  }
  for (const p of pages) {
    entries.push({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly", priority: 0.3 });
  }
  for (const c of categories) {
    entries.push({ url: absoluteUrl(`/categorie/${c.slug}`), changeFrequency: "weekly", priority: 0.5 });
  }
  for (const t of tags) {
    entries.push({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly", priority: 0.4 });
  }
  for (const au of authors) {
    if (au.slug) entries.push({ url: absoluteUrl(`/auteur/${au.slug}`), lastModified: au.updatedAt, changeFrequency: "weekly", priority: 0.4 });
  }

  return entries;
}
