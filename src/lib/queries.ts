import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Couche de requêtes pour le frontend public.
 *
 * Règle centrale : on n'expose JAMAIS que le contenu réellement publié.
 * publishedFilter() encapsule cette condition (status PUBLISHED + date de
 * publication atteinte) pour qu'aucune page ne l'oublie.
 *
 * Toutes les listes sont paginées (pas d'infinite scroll — choix SEO).
 */

export const DEFAULT_PAGE_SIZE = 12;

/** Condition « article publié et visible maintenant ». */
export function publishedArticleWhere(): Prisma.ArticleWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { not: null, lte: new Date() },
  };
}

/** Condition « quizz publié et visible maintenant ». */
export function publishedQuizWhere(): Prisma.QuizWhereInput {
  return {
    status: "PUBLISHED",
    publishedAt: { not: null, lte: new Date() },
  };
}

// Sélection légère pour les cartes de liste (évite de charger le contenu).
const articleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  coverImageThumb: true,
  coverImageWidth: true,
  coverImageHeight: true,
  viewCount: true,
  publishedAt: true,
  featured: true,
  pinned: true,
  author: { select: { name: true, slug: true, image: true } },
  category: { select: { name: true, slug: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.ArticleSelect;

export type ArticleCard = Prisma.ArticleGetPayload<{
  select: typeof articleCardSelect;
}>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

function paginate<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ------------------------------------------------------------------
// ARTICLE UNIQUE (page article)
// ------------------------------------------------------------------

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, ...publishedArticleWhere() },
    include: {
      author: {
        select: { id: true, name: true, slug: true, image: true, bio: true },
      },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      faqItems: { orderBy: { order: "asc" } },
      affiliateProducts: {
        orderBy: { order: "asc" },
        include: { product: true },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });
}

/** Articles liés : même catégorie ou tags communs, hors article courant. */
export async function getRelatedArticles(
  articleId: string,
  categoryId: string | null,
  tagIds: string[],
  limit = 4,
): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: {
      ...publishedArticleWhere(),
      id: { not: articleId },
      OR: [
        ...(categoryId ? [{ categoryId }] : []),
        ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

// ------------------------------------------------------------------
// LISTES (landing + tag + catégorie + auteur)
// ------------------------------------------------------------------

export async function getRecentArticles(
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<ArticleCard>> {
  const where = publishedArticleWhere();
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);
  return paginate(items, total, page, pageSize);
}

export async function getMostViewedArticles(limit = 8): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: publishedArticleWhere(),
    select: articleCardSelect,
    orderBy: { viewCount: "desc" },
    take: limit,
  });
}

export async function getMostLikedArticles(limit = 8): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: publishedArticleWhere(),
    select: articleCardSelect,
    orderBy: { likes: { _count: "desc" } },
    take: limit,
  });
}

export async function getFeaturedArticles(limit = 8): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: { ...publishedArticleWhere(), featured: true },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

/** Article du Hero : épinglé en priorité, sinon le plus récent. */
export async function getHeroArticle(): Promise<ArticleCard | null> {
  const pinned = await prisma.article.findFirst({
    where: { ...publishedArticleWhere(), pinned: true },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
  });
  if (pinned) return pinned;

  return prisma.article.findFirst({
    where: publishedArticleWhere(),
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
  });
}

export async function getArticlesByCategorySlug(
  slug: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ category: { name: string; description: string | null } | null } & Paginated<ArticleCard>> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true },
  });

  if (!category) {
    return { category: null, ...paginate<ArticleCard>([], 0, page, pageSize) };
  }

  const where: Prisma.ArticleWhereInput = {
    ...publishedArticleWhere(),
    categoryId: category.id,
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return {
    category: { name: category.name, description: category.description },
    ...paginate(items, total, page, pageSize),
  };
}

export async function getArticlesByTagSlug(
  slug: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<{ tag: { name: string } | null } & Paginated<ArticleCard>> {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!tag) {
    return { tag: null, ...paginate<ArticleCard>([], 0, page, pageSize) };
  }

  const where: Prisma.ArticleWhereInput = {
    ...publishedArticleWhere(),
    tags: { some: { tagId: tag.id } },
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);

  return { tag: { name: tag.name }, ...paginate(items, total, page, pageSize) };
}

// ------------------------------------------------------------------
// AUTEUR (page /auteur/[slug])
// ------------------------------------------------------------------

export async function getAuthorBySlug(slug: string) {
  return prisma.user.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, image: true, bio: true },
  });
}

export async function getArticlesByAuthorId(
  authorId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<ArticleCard>> {
  const where: Prisma.ArticleWhereInput = {
    ...publishedArticleWhere(),
    authorId,
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      select: articleCardSelect,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);
  return paginate(items, total, page, pageSize);
}

// ------------------------------------------------------------------
// CATÉGORIES (sections landing + footer)
// ------------------------------------------------------------------

export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { articles: { some: publishedArticleWhere() } },
    select: { id: true, name: true, slug: true, description: true },
    orderBy: { order: "asc" },
  });
}

export async function getArticlesForCategoryRow(
  categoryId: string,
  limit = 8,
): Promise<ArticleCard[]> {
  return prisma.article.findMany({
    where: { ...publishedArticleWhere(), categoryId },
    select: articleCardSelect,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

// ------------------------------------------------------------------
// RECHERCHE
// ------------------------------------------------------------------

export interface SearchFilters {
  q?: string;
  categorySlug?: string;
  tagSlug?: string;
  authorSlug?: string;
  from?: Date;
  to?: Date;
}

export interface SearchResultItem {
  type: "article" | "quiz";
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageThumb: string | null;
  publishedAt: Date | null;
}

/**
 * Recherche articles + quizz (SQL LIKE via `contains`, insensible à la casse).
 * Résultats mélangés et triés par date, avec indicateur de type.
 */
export async function search(
  filters: SearchFilters,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<SearchResultItem>> {
  const { q, categorySlug, tagSlug, authorSlug, from, to } = filters;

  const dateFilter =
    from || to
      ? { publishedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {};

  const articleWhere: Prisma.ArticleWhereInput = {
    ...publishedArticleWhere(),
    ...dateFilter,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(authorSlug ? { author: { slug: authorSlug } } : {}),
  };

  // Les quizz n'ont ni auteur public filtrable de la même façon ni tags slug
  // identiques : on applique les filtres compatibles.
  const quizWhere: Prisma.QuizWhereInput = {
    ...publishedQuizWhere(),
    ...dateFilter,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tagSlug ? { tags: { some: { tag: { slug: tagSlug } } } } : {}),
    ...(authorSlug ? { author: { slug: authorSlug } } : {}),
  };

  const [articles, quizzes] = await Promise.all([
    prisma.article.findMany({
      where: articleWhere,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImageThumb: true, publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 200, // borne raisonnable avant fusion + pagination en mémoire
    }),
    prisma.quiz.findMany({
      where: quizWhere,
      select: {
        id: true, title: true, slug: true, description: true,
        coverImageThumb: true, publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 200,
    }),
  ]);

  const merged: SearchResultItem[] = [
    ...articles.map((a) => ({
      type: "article" as const,
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      coverImageThumb: a.coverImageThumb,
      publishedAt: a.publishedAt,
    })),
    ...quizzes.map((qz) => ({
      type: "quiz" as const,
      id: qz.id,
      title: qz.title,
      slug: qz.slug,
      excerpt: qz.description,
      coverImageThumb: qz.coverImageThumb,
      publishedAt: qz.publishedAt,
    })),
  ].sort(
    (a, b) =>
      (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
  );

  const total = merged.length;
  const items = merged.slice((page - 1) * pageSize, page * pageSize);
  return paginate(items, total, page, pageSize);
}

// Pour les filtres du formulaire de recherche
export async function getSearchFacets() {
  const [categories, tags, authors] = await Promise.all([
    prisma.category.findMany({
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { slug: { not: null }, articles: { some: publishedArticleWhere() } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { categories, tags, authors };
}

// ------------------------------------------------------------------
// COMPTEUR DE VUES (sans cookie) — incrément simple
// ------------------------------------------------------------------

export async function incrementArticleView(articleId: string): Promise<void> {
  try {
    await prisma.article.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("[views] incrément impossible :", error);
  }
}
