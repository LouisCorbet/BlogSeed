import Link from "next/link";

/**
 * Pagination par liens (et non infinite scroll) — meilleure indexation.
 * basePath : chemin de base ; on y ajoute ?page=N (en conservant les
 * éventuels paramètres déjà présents via extraQuery).
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  extraQuery,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  extraQuery?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number): string {
    const params = new URLSearchParams();
    if (extraQuery) {
      for (const [k, v] of Object.entries(extraQuery)) {
        if (v) params.set(k, v);
      }
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // Fenêtre de pages affichées autour de la page courante.
  const windowSize = 2;
  const pages: number[] = [];
  for (let p = Math.max(1, page - windowSize); p <= Math.min(totalPages, page + windowSize); p++) {
    pages.push(p);
  }

  const linkStyle: React.CSSProperties = {
    padding: "0.4rem 0.7rem",
    borderRadius: "var(--radius-base)",
    border: "1px solid rgba(127,127,127,0.3)",
    textDecoration: "none",
    color: "inherit",
  };
  const activeStyle: React.CSSProperties = {
    ...linkStyle,
    background: "var(--color-primary)",
    color: "#fff",
    borderColor: "var(--color-primary)",
  };

  return (
    <nav
      aria-label="Pagination"
      style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginTop: "2rem", flexWrap: "wrap" }}
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} style={linkStyle} rel="prev">
          ← Précédent
        </Link>
      ) : null}

      {pages[0] > 1 ? (
        <>
          <Link href={hrefFor(1)} style={linkStyle}>1</Link>
          {pages[0] > 2 ? <span style={{ padding: "0.4rem" }}>…</span> : null}
        </>
      ) : null}

      {pages.map((p) => (
        <Link key={p} href={hrefFor(p)} style={p === page ? activeStyle : linkStyle} aria-current={p === page ? "page" : undefined}>
          {p}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages ? (
        <>
          {pages[pages.length - 1] < totalPages - 1 ? <span style={{ padding: "0.4rem" }}>…</span> : null}
          <Link href={hrefFor(totalPages)} style={linkStyle}>{totalPages}</Link>
        </>
      ) : null}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} style={linkStyle} rel="next">
          Suivant →
        </Link>
      ) : null}
    </nav>
  );
}
