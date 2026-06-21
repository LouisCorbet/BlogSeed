import Link from "next/link";

/**
 * En-tête public minimal (v1) : titre du blog + accès recherche.
 * Le style sera retravaillé en Phase 10 (apparence/thème).
 */
export function SiteHeader({ blogTitle }: { blogTitle: string }) {
  return (
    <header
      style={{
        borderBottom: "1px solid rgba(127,127,127,0.2)",
        padding: "1rem 1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <Link href="/" style={{ fontWeight: 700, fontSize: "1.15rem", color: "inherit", textDecoration: "none" }}>
        {blogTitle}
      </Link>
      <nav style={{ display: "flex", gap: "1rem", alignItems: "center", fontSize: "0.9rem" }}>
        <Link href="/quiz" style={{ color: "inherit", textDecoration: "none" }}>Quizz</Link>
        <Link href="/produits" style={{ color: "inherit", textDecoration: "none" }}>Produits</Link>
        <Link href="/recherche" style={{ color: "inherit", textDecoration: "none" }}>Recherche</Link>
      </nav>
    </header>
  );
}
