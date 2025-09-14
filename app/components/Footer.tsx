// app/components/Footer.tsx
import Link from "next/link";
import { readSiteSettings } from "@/lib/siteSettings.server";

export default async function Footer() {
  const s = await readSiteSettings();

  // Contenus pilotés par les settings (avec fallbacks sûrs)
  const siteName = s.name || "";
  const about = s.about || "";
  const contactEmail = s.contactEmail || "";

  return (
    <footer className="bg-base-100 border-t border-base-300">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Colonne 1 — À propos */}
        <div>
          <h2 className="font-semibold mb-3">À propos</h2>
          {about ? (
            <p className="text-sm text-base-content/70">{about}</p>
          ) : (
            <p className="text-sm text-base-content/70">
              {/* Fallback si aucun texte n’est défini dans les settings */}
              {siteName}
            </p>
          )}
        </div>

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

        {/* Colonne 3 — Coordonnées depuis les settings */}
        <div>
          <h2 className="font-semibold mb-3">Coordonnées</h2>
          <ul className="text-sm text-base-content/70 space-y-1">
            {contactEmail && (
              <li>
                📧{" "}
                <a className="link" href={`mailto:${contactEmail}`}>
                  {contactEmail}
                </a>
              </li>
            )}
            {/* Ajoute d’autres champs plus tard (phone, adresse) si tu les ajoutes aux settings */}
          </ul>
        </div>
      </div>

      {/* Bas de page */}
      <div className="border-t border-base-300 mt-6">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-base-content/60">
          <p>
            © {new Date().getFullYear()} {siteName}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
