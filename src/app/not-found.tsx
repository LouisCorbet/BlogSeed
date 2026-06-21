import Link from "next/link";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import { sanitizeHtml } from "@/lib/content";

/**
 * Page 404 personnalisable. Le contenu est édité depuis l'admin (Phase 8.16)
 * et stocké dans Setting (clé page.notFoundContent). Fallback simple sinon.
 */
export default async function NotFound() {
  const custom = await getSetting(SETTING_KEYS.NOT_FOUND_CONTENT);

  return (
    <div style={{ maxWidth: 640, margin: "4rem auto", padding: "1.5rem", textAlign: "center" }}>
      {custom ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(custom) }} />
      ) : (
        <>
          <h1 style={{ fontSize: "3rem", margin: "0 0 0.5rem" }}>404</h1>
          <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
            Cette page n'existe pas ou a été déplacée.
          </p>
        </>
      )}
      <Link
        href="/"
        style={{ display: "inline-block", padding: "0.6rem 1.2rem", background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-base)", textDecoration: "none", fontWeight: 600 }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
