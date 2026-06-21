import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getAuthorBySlug, getArticlesByAuthorId } from "@/lib/queries";
import { ArticleGrid } from "@/components/article/article-lists";
import { Pagination } from "@/components/pagination";
import { Breadcrumb } from "@/components/breadcrumb";
import { absoluteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return { title: "Auteur introuvable" };
  return {
    title: author.name ?? "Auteur",
    description: author.bio ?? `Articles de ${author.name}`,
  };
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const author = await getAuthorBySlug(slug);
  if (!author) notFound();

  const result = await getArticlesByAuthorId(author.id, page);

  // JSON-LD Person (de base ; le SEO avancé est affiné en Phase 7)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio ?? undefined,
    image: author.image ? absoluteUrl(author.image) : undefined,
    url: absoluteUrl(`/auteur/${author.slug}`),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumb
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: author.name ?? "Auteur", href: `/auteur/${slug}` },
        ]}
      />

      <header style={{ display: "flex", gap: "1.25rem", alignItems: "center", marginBottom: "2rem" }}>
        {author.image ? (
          <Image src={author.image} alt={author.name ?? ""} width={72} height={72} style={{ borderRadius: "50%", flexShrink: 0 }} />
        ) : null}
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.4rem" }}>{author.name}</h1>
          {author.bio ? <p style={{ margin: 0, opacity: 0.8 }}>{author.bio}</p> : null}
        </div>
      </header>

      <ArticleGrid articles={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} basePath={`/auteur/${slug}`} />
    </div>
  );
}
