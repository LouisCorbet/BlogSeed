// app/contact/page.tsx
import { readSiteSettings } from "@/lib/siteSettings.server";

export const metadata = {
  title: "Contact",
  description: "Entrez en contact avec nous facilement.",
};

export default async function ContactPage() {
  const s = await readSiteSettings();

  // Contenus pilotés par les settings (avec fallbacks sûrs)
  const contactEmail = s.contactEmail || "";
  const contactPhone = s.contactPhone || "";

  return (
    <main className="bg-base-200">
      {/* Hero */}
      <section className="hero bg-base-100 border-b border-base-300">
        <div className="hero-content max-w-3xl w-full flex-col gap-6 py-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
          <p className="text-base-content/70">
            Une question, une suggestion, ou juste envie de dire bonjour ?
            Retrouvez ici toutes nos coordonnées pour nous joindre facilement.
          </p>
        </div>
      </section>

      {/* Coordonnées */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Carte email */}
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body items-center text-center">
              <div className="text-primary text-3xl">📧</div>
              <h2 className="card-title">Email</h2>
              <p className="text-base-content/70">{contactEmail}</p>

              {contactEmail && (
                <a
                  className="btn btn-sm btn-outline mt-2"
                  href={`mailto:${contactEmail}`}
                >
                  {contactEmail}
                </a>
              )}
            </div>
          </div>

          {/* Carte téléphone */}
          <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="card-body items-center text-center">
              <div className="text-primary text-3xl">📞</div>
              <h2 className="card-title">Téléphone</h2>

              <p className="text-base-content/70">{contactPhone}</p>

              {contactPhone && (
                <a
                  className="btn btn-sm btn-outline mt-2"
                  href={`tel:${contactPhone}`}
                >
                  {contactPhone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
