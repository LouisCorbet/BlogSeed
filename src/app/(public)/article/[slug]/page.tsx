import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getArticleBySlug,
  getRelatedArticles,
  incrementArticleView,
} from "@/lib/queries";
import {
  sanitizeHtml,
  addHeadingIds,
  extractHeadings,
  estimateReadingTime,
} from "@/lib/content";
import { absoluteUrl } from "@/lib/site-url";
import { Breadcrumb } from "@/components/breadcrumb";
import { ReadingProgress } from "@/components/article/reading-progress";
import { TableOfContents } from "@/components/article/table-of-contents";
import { ShareButtons } from "@/components/article/share-buttons";
import { ArticleGrid } from "@/components/article/article-lists";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable" };

  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt ?? undefined;
  const url = absoluteUrl(`/article/${article.slug}`);
  const image = article.coverImage ? absoluteUrl(article.coverImage) : undefined;

  return {
    title,
    description,
    alternates: { canonical: article.canonicalUrl ?? url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
      publishedTime: article.publishedAt?.toISOString(),
      authors: article.author?.name ? [article.author.name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  // Compteur de vues (sans cookie). Fire-and-forget pour ne pas bloquer le rendu.
  void incrementArticleView(article.id);

  // Préparation du contenu : sanitization PUIS ancres sur les titres.
  const safeHtml = addHeadingIds(sanitizeHtml(article.content));
  const headings = extractHeadings(safeHtml);
  const readingTime = estimateReadingTime(safeHtml);

  const related = await getRelatedArticles(
    article.id,
    article.categoryId,
    article.tags.map((t) => t.tagId),
    4,
  );

  const url = absoluteUrl(`/article/${article.slug}`);

  const crumbs = [
    { label: "Accueil", href: "/" },
    ...(article.category
      ? [{ label: article.category.name, href: `/categorie/${article.category.slug}` }]
      : []),
    { label: article.title, href: `/article/${article.slug}` },
  ];

  return (
    <>
      <ReadingProgress />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: "2rem" }}>
        <article style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
          <Breadcrumb crumbs={crumbs} />

          {article.category ? (
            <Link
              href={`/categorie/${article.category.slug}`}
              style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-link)", textDecoration: "none" }}
            >
              {article.category.name}
            </Link>
          ) : null}

          <h1 style={{ fontSize: "2.25rem", lineHeight: 1.15, margin: "0.5rem 0 1rem" }}>
            {article.title}
          </h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", fontSize: "0.85rem", opacity: 0.75, marginBottom: "1.5rem" }}>
            {article.author ? (
              <Link
                href={article.author.slug ? `/auteur/${article.author.slug}` : "#"}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "inherit", textDecoration: "none" }}
              >
                {article.author.image ? (
                  <Image src={article.author.image} alt={article.author.name ?? ""} width={28} height={28} style={{ borderRadius: "50%" }} />
                ) : null}
                <span>{article.author.name}</span>
              </Link>
            ) : null}
            {article.publishedAt ? (
              <time dateTime={article.publishedAt.toISOString()}>
                {article.publishedAt.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            ) : null}
            <span>{readingTime} min de lecture</span>
            <span>{article.viewCount} vues</span>
          </div>

          {article.coverImage ? (
            <div style={{ position: "relative", aspectRatio: "16 / 9", marginBottom: "1.5rem", borderRadius: "var(--radius-base)", overflow: "hidden", background: "rgba(127,127,127,0.1)" }}>
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 760px) 100vw, 760px"
                style={{ objectFit: "cover" }}
              />
            </div>
          ) : null}

          {/* Encart disclosure affiliation (si activé) — le bloc produit complet vient en Phase 9 */}
          {article.showAffiliateDisclosure ? (
            <p style={{ fontSize: "0.8rem", fontStyle: "italic", opacity: 0.7, borderLeft: "3px solid var(--color-primary)", paddingLeft: "0.75rem", marginBottom: "1.5rem" }}>
              Cet article contient des liens affiliés. En achetant via ces liens, vous soutenez le blog sans surcoût pour vous.
            </p>
          ) : null}

          {/* Table des matières (mobile/inline) */}
          {headings.length > 0 ? (
            <div style={{ border: "1px solid rgba(127,127,127,0.2)", borderRadius: "var(--radius-base)", padding: "1rem", marginBottom: "1.5rem" }}>
              <TableOfContents headings={headings} />
            </div>
          ) : null}

          {/* Contenu de l'article (déjà sanitizé côté serveur) */}
          <div
            className="article-content"
            style={{ lineHeight: 1.7, fontSize: "1.05rem" }}
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {/* FAQ */}
          {article.faqItems.length > 0 ? (
            <section style={{ marginTop: "2.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Questions fréquentes</h2>
              {article.faqItems.map((item) => (
                <details key={item.id} style={{ borderBottom: "1px solid rgba(127,127,127,0.2)", padding: "0.75rem 0" }}>
                  <summary style={{ fontWeight: 600, cursor: "pointer" }}>{item.question}</summary>
                  <div style={{ marginTop: "0.5rem", opacity: 0.85 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.answer) }} />
                </details>
              ))}
            </section>
          ) : null}

          {/* Tags */}
          {article.tags.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "2rem" }}>
              {article.tags.map((t) => (
                <Link
                  key={t.tag.slug}
                  href={`/tag/${t.tag.slug}`}
                  style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", border: "1px solid rgba(127,127,127,0.3)", borderRadius: "999px", color: "inherit", textDecoration: "none" }}
                >
                  #{t.tag.name}
                </Link>
              ))}
            </div>
          ) : null}

          {/* Partage social */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(127,127,127,0.2)" }}>
            <ShareButtons url={url} title={article.title} />
          </div>

          {/* Bio auteur */}
          {article.author?.bio ? (
            <div style={{ marginTop: "2rem", padding: "1.25rem", border: "1px solid rgba(127,127,127,0.2)", borderRadius: "var(--radius-base)", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              {article.author.image ? (
                <Image src={article.author.image} alt={article.author.name ?? ""} width={56} height={56} style={{ borderRadius: "50%", flexShrink: 0 }} />
              ) : null}
              <div>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>
                  {article.author.slug ? (
                    <Link href={`/auteur/${article.author.slug}`} style={{ color: "inherit" }}>{article.author.name}</Link>
                  ) : (
                    article.author.name
                  )}
                </p>
                <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>{article.author.bio}</p>
              </div>
            </div>
          ) : null}

          {/* Emplacement LIKES — activé en Phase 6 (interactions utilisateurs) */}
          {/* Emplacement COMMENTAIRES — activé en Phase 6 (thread + modération admin) */}
          <div data-placeholder="comments" style={{ marginTop: "2.5rem", padding: "1.5rem", border: "1px dashed rgba(127,127,127,0.3)", borderRadius: "var(--radius-base)", textAlign: "center", opacity: 0.5, fontSize: "0.85rem" }}>
            Les likes et commentaires seront activés en Phase 6.
          </div>
        </article>
      </div>

      {/* Articles liés */}
      {related.length > 0 ? (
        <section style={{ marginTop: "3rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>À lire aussi</h2>
          <ArticleGrid articles={related} />
        </section>
      ) : null}
    </>
  );
}
