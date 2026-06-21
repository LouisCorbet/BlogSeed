import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { search, getSearchFacets, type SearchResultItem } from "@/lib/queries";
import { SearchForm } from "@/components/search/search-form";
import { Pagination } from "@/components/pagination";

export const metadata: Metadata = {
  title: "Recherche",
  robots: { index: false }, // pages de résultats non indexées (bonne pratique)
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    categorie?: string;
    tag?: string;
    auteur?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const facets = await getSearchFacets();

  const hasQuery = Boolean(sp.q || sp.categorie || sp.tag || sp.auteur || sp.from || sp.to);

  const results = hasQuery
    ? await search(
        {
          q: sp.q,
          categorySlug: sp.categorie,
          tagSlug: sp.tag,
          authorSlug: sp.auteur,
          from: parseDate(sp.from),
          to: parseDate(sp.to),
        },
        page,
      )
    : null;

  return (
    <div>
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>Recherche</h1>

      <SearchForm categories={facets.categories} tags={facets.tags} authors={facets.authors} />

      {results ? (
        results.items.length === 0 ? (
          <p style={{ opacity: 0.7 }}>Aucun résultat ne correspond à votre recherche.</p>
        ) : (
          <>
            <p style={{ opacity: 0.7, marginBottom: "1rem" }}>
              {results.total} résultat{results.total > 1 ? "s" : ""}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
              {results.items.map((item) => (
                <SearchResultRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </ul>
            <Pagination
              page={results.page}
              totalPages={results.totalPages}
              basePath="/recherche"
              extraQuery={{
                q: sp.q, categorie: sp.categorie, tag: sp.tag,
                auteur: sp.auteur, from: sp.from, to: sp.to,
              }}
            />
          </>
        )
      ) : (
        <p style={{ opacity: 0.6 }}>Saisissez un terme ou utilisez les filtres pour lancer une recherche.</p>
      )}
    </div>
  );
}

function SearchResultRow({ item }: { item: SearchResultItem }) {
  const href = item.type === "article" ? `/article/${item.slug}` : `/quiz/${item.slug}`;
  return (
    <li style={{ display: "flex", gap: "1rem", border: "1px solid rgba(127,127,127,0.2)", borderRadius: "var(--radius-base)", overflow: "hidden" }}>
      <Link href={href} style={{ display: "flex", gap: "1rem", color: "inherit", textDecoration: "none", width: "100%", padding: "0.75rem" }}>
        {item.coverImageThumb ? (
          <div style={{ position: "relative", width: 96, height: 64, flexShrink: 0, borderRadius: "calc(var(--radius-base) / 1.5)", overflow: "hidden", background: "rgba(127,127,127,0.1)" }}>
            <Image src={item.coverImageThumb} alt={item.title} fill sizes="96px" style={{ objectFit: "cover" }} />
          </div>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.6 }}>
            {item.type === "article" ? "Article" : "Quizz"}
          </span>
          <h2 style={{ fontSize: "1.1rem", margin: "0.2rem 0" }}>{item.title}</h2>
          {item.excerpt ? (
            <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.75, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {item.excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
