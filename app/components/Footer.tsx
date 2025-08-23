import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-base-100 border-t border-base-300">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Colonne 1 */}
        <div>
          <h2 className="font-semibold mb-3">À propos</h2>
          <p className="text-sm text-base-content/70">
            Mon Blog partage des articles, guides et inspirations. Contenu
            rapide, léger et SEO-friendly ✨
          </p>
        </div>

        {/* Colonne 2 */}
        <div>
          <h2 className="font-semibold mb-3">Navigation</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/" className="link link-hover">
                Accueil
              </Link>
            </li>

            <li>
              <Link href="/contact" className="link link-hover">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 */}
        <div>
          <h2 className="font-semibold mb-3">Coordonnées</h2>
          <ul className="text-sm text-base-content/70 space-y-1">
            <li>📍 123 Rue de l&apos;Exemple, 69000 Lyon</li>
            <li>📧 contact@monsite.com</li>
            <li>📞 +33 6 12 34 56 78</li>
          </ul>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-base-300 mt-6">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-base-content/60">
          <p>© {new Date().getFullYear()} Mon Blog. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
