import Link from "next/link";
import Image from "next/image";
import { getJSONSetting, getSettings, SETTING_KEYS } from "@/lib/settings";
import {
  getHeroArticle,
  getRecentArticles,
  getMostViewedArticles,
  getMostLikedArticles,
  getFeaturedArticles,
  getActiveCategories,
  getArticlesForCategoryRow,
} from "@/lib/queries";
import { ArticleGrid, ArticleRow } from "@/components/article/article-lists";

export const dynamic = "force-dynamic"; // listes temps réel ; ISR affinée en Phase 7

/**
 * Configuration des sections de la landing (ordre + visibilité), pilotée
 * depuis l'admin en Phase 8.11. Valeurs par défaut raisonnables ici.
 */
interface LandingSection {
  type: "hero" | "recent" | "mostViewed" | "mostLiked" | "featured" | "byCategory";
  visible: boolean;
}

const DEFAULT_SECTIONS: LandingSection[] = [
  { type: "hero", visible: true },
  { type: "recent", visible: true },
  { type: "featured", visible: true },
  { type: "mostViewed", visible: true },
  { type: "mostLiked", visible: true },
  { type: "byCategory", visible: true },
];

export default async function HomePage() {
  const [sections, settings] = await Promise.all([
    getJSONSetting<LandingSection[]>(SETTING_KEYS.LANDING_SECTIONS, DEFAULT_SECTIONS),
    getSettings([SETTING_KEYS.BLOG_TITLE, SETTING_KEYS.BLOG_DESCRIPTION]),
  ]);

  const blogTitle = settings[SETTING_KEYS.BLOG_TITLE] ?? "Mon Blog";
  const blogDescription = settings[SETTING_KEYS.BLOG_DESCRIPTION] ?? "";

  const active = sections.filter((s) => s.visible);
  const needs = new Set(active.map((s) => s.type));

  // On ne charge que ce qui est nécessaire selon les sections actives.
  const [hero, recent, featured, mostViewed, mostLiked, categories] =
    await Promise.all([
      needs.has("hero") ? getHeroArticle() : Promise.resolve(null),
      needs.has("recent") ? getRecentArticles(1, 6) : Promise.resolve(null),
      needs.has("featured") ? getFeaturedArticles(8) : Promise.resolve([]),
      needs.has("mostViewed") ? getMostViewedArticles(8) : Promise.resolve([]),
      needs.has("mostLiked") ? getMostLikedArticles(8) : Promise.resolve([]),
      needs.has("byCategory") ? getActiveCategories() : Promise.resolve([]),
    ]);

  // Pré-charge les lignes par catégorie.
  const categoryRows = needs.has("byCategory")
    ? await Promise.all(
        categories.map(async (c) => ({
          category: c,
          articles: await getArticlesForCategoryRow(c.id, 8),
        })),
      )
    : [];

  return (
    <div>
      {active.map((section) => {
        switch (section.type) {
          case "hero":
            return hero ? <HeroBlock key="hero" article={hero} fallbackTitle={blogTitle} description={blogDescription} /> : null;

          case "recent":
            return recent ? (
              <section key="recent" style={{ marginBottom: "2.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                  <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Les plus récents</h2>
                </div>
                <ArticleGrid articles={recent.items} />
              </section>
            ) : null;

          case "featured":
            return <ArticleRow key="featured" title="Sélection de l'éditeur" articles={featured} />;

          case "mostViewed":
            return <ArticleRow key="mostViewed" title="Les plus vus" articles={mostViewed} />;

          case "mostLiked":
            return <ArticleRow key="mostLiked" title="Les plus likés" articles={mostLiked} />;

          case "byCategory":
            return (
              <div key="byCategory">
                {categoryRows.map(({ category, articles }) => (
                  <ArticleRow
                    key={category.id}
                    title={category.name}
                    articles={articles}
                    moreHref={`/categorie/${category.slug}`}
                  />
                ))}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

function HeroBlock({
  article,
  fallbackTitle,
  description,
}: {
  article: NonNullable<Awaited<ReturnType<typeof getHeroArticle>>>;
  fallbackTitle: string;
  description: string;
}) {
  const cover = article.coverImage ?? article.coverImageThumb;
  return (
    <section
      style={{
        position: "relative",
        borderRadius: "var(--radius-base)",
        overflow: "hidden",
        marginBottom: "2.5rem",
        minHeight: 320,
        display: "flex",
        alignItems: "flex-end",
        background: "rgba(127,127,127,0.1)",
      }}
    >
      {cover ? (
        <Image
          src={cover}
          alt={article.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          width: "100%",
          padding: "2rem 1.5rem",
          background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
          color: "#fff",
        }}
      >
        {description ? (
          <p style={{ margin: "0 0 0.5rem", opacity: 0.85, fontSize: "0.9rem" }}>{description}</p>
        ) : null}
        <h1 style={{ fontSize: "2rem", margin: "0 0 0.75rem", lineHeight: 1.15 }}>{article.title}</h1>
        {article.excerpt ? (
          <p style={{ margin: "0 0 1rem", maxWidth: 640 }}>{article.excerpt}</p>
        ) : null}
        <Link
          href={`/article/${article.slug}`}
          style={{
            display: "inline-block",
            padding: "0.6rem 1.2rem",
            background: "var(--color-primary)",
            color: "#fff",
            borderRadius: "var(--radius-base)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Lire l'article
        </Link>
      </div>
    </section>
  );
}
