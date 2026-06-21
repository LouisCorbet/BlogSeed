import Link from "next/link";
import { absoluteUrl } from "@/lib/site-url";

export interface Crumb {
  label: string;
  href: string;
}

/**
 * Fil d'Ariane + structured data BreadcrumbList (JSON-LD).
 * Le JSON-LD de base est posé ici dès la Phase 3 ; le SEO avancé
 * (Article, Person, etc.) viendra en Phase 7.
 */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: absoluteUrl(c.href),
    })),
  };

  return (
    <nav aria-label="Fil d'Ariane" style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "1rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: "0.4rem", padding: 0, margin: 0 }}>
        {crumbs.map((c, i) => (
          <li key={c.href} style={{ display: "flex", gap: "0.4rem" }}>
            {i < crumbs.length - 1 ? (
              <>
                <Link href={c.href} style={{ color: "inherit" }}>{c.label}</Link>
                <span aria-hidden="true">/</span>
              </>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
