import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticlesByTagSlug } from "@/lib/queries";
import { ArticleGrid } from "@/components/article/article-lists";
import { Pagination } from "@/components/pagination";
import { Breadcrumb } from "@/components/breadcrumb";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { tag } = await getArticlesByTagSlug(slug, 1, 1);
  if (!tag) return { title: "Tag introuvable" };
  return {
    title: `#${tag.name}`,
    description: `Articles taggés ${tag.name}`,
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const result = await getArticlesByTagSlug(slug, page);
  if (!result.tag) notFound();

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: `#${result.tag.name}`, href: `/tag/${slug}` },
        ]}
      />
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>#{result.tag.name}</h1>

      <ArticleGrid articles={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} basePath={`/tag/${slug}`} />
    </div>
  );
}
