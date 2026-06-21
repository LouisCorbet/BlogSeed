import type { ArticleCard as ArticleCardData } from "@/lib/queries";
import { ArticleCard } from "./article-card";

/**
 * Grille responsive d'articles (utilisée pour les listes paginées).
 */
export function ArticleGrid({ articles }: { articles: ArticleCardData[] }) {
  if (articles.length === 0) {
    return <p style={{ opacity: 0.6 }}>Aucun article pour le moment.</p>;
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1.25rem",
      }}
    >
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  );
}

/**
 * Ligne horizontale défilable (rangée « façon Netflix »).
 * Utilisée pour « les plus vus », « les plus likés », « par catégorie ».
 */
export function ArticleRow({
  title,
  articles,
  moreHref,
}: {
  title: string;
  articles: ArticleCardData[];
  moreHref?: string;
}) {
  if (articles.length === 0) return null;
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.25rem", margin: 0 }}>{title}</h2>
        {moreHref ? (
          <a href={moreHref} style={{ fontSize: "0.85rem", color: "var(--color-link)" }}>
            Tout voir →
          </a>
        ) : null}
      </div>
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(240px, 1fr)",
          gap: "1rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
        }}
      >
        {articles.map((a) => (
          <div key={a.id} style={{ minWidth: 240 }}>
            <ArticleCard article={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
