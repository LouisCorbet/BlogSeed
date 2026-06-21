import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticlesByCategorySlug } from "@/lib/queries";
import { ArticleGrid } from "@/components/article/article-lists";
import { Pagination } from "@/components/pagination";
import { Breadcrumb } from "@/components/breadcrumb";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getArticlesByCategorySlug(slug, 1, 1);
  if (!category) return { title: "Catégorie introuvable" };
  return {
    title: category.name,
    description: category.description ?? `Articles de la catégorie ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const result = await getArticlesByCategorySlug(slug, page);
  if (!result.category) notFound();

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: "Accueil", href: "/" },
          { label: result.category.name, href: `/categorie/${slug}` },
        ]}
      />
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{result.category.name}</h1>
      {result.category.description ? (
        <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>{result.category.description}</p>
      ) : null}

      <ArticleGrid articles={result.items} />
      <Pagination page={result.page} totalPages={result.totalPages} basePath={`/categorie/${slug}`} />
    </div>
  );
}
