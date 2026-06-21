import Link from "next/link";
import Image from "next/image";
import type { ArticleCard as ArticleCardData } from "@/lib/queries";

/**
 * Carte d'article réutilisée dans toutes les listes (landing, tag, catégorie,
 * auteur, articles liés). Affiche couverture (thumbnail), titre, extrait,
 * métadonnées légères (auteur, catégorie, vues, likes).
 */
export function ArticleCard({ article }: { article: ArticleCardData }) {
  const cover = article.coverImageThumb ?? article.coverImage;

  return (
    <article
      style={{
        border: "1px solid rgba(127,127,127,0.2)",
        borderRadius: "var(--radius-base)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "rgba(127,127,127,0.03)",
      }}
    >
      <Link
        href={`/article/${article.slug}`}
        style={{ color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}
      >
        <div style={{ position: "relative", aspectRatio: "16 / 9", background: "rgba(127,127,127,0.1)" }}>
          {cover ? (
            <Image
              src={cover}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          ) : null}
        </div>
        <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
          {article.category ? (
            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>
              {article.category.name}
            </span>
          ) : null}
          <h3 style={{ fontSize: "1.05rem", lineHeight: 1.3, margin: 0 }}>{article.title}</h3>
          {article.excerpt ? (
            <p style={{ fontSize: "0.875rem", opacity: 0.8, margin: 0, flex: 1 }}>
              {article.excerpt}
            </p>
          ) : null}
          <div style={{ fontSize: "0.75rem", opacity: 0.6, display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            {article.author?.name ? <span>{article.author.name}</span> : null}
            <span>{article.viewCount} vues</span>
            <span>{article._count.likes} ♥</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
