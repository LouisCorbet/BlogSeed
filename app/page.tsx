import Link from "next/link";
import { readIndex } from "@/lib/store";

export default async function Home() {
  const all = await readIndex();
  const latest = [...all]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-base-200">
      {/* Hero */}
      <section className="hero bg-base-100/70 border-b border-base-300">
        <div className="hero-content max-w-5xl w-full flex-col lg:flex-row gap-10 py-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Mon <span className="text-primary">Blog</span>
            </h1>
            <p className="py-4 text-base-content/70">
              Derniers articles, guides et inspirations. Tout est servi léger,
              rapide, et SEO-friendly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/articles" className="btn btn-primary">
                Voir tous les articles
              </Link>
              <Link href="/admin" className="btn btn-ghost">
                Administration
              </Link>
            </div>
          </div>
          <div className="flex-1">
            <div className="mockup-window border bg-base-300">
              <div className="bg-base-200 px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="badge badge-primary badge-outline">
                    Next.js
                  </div>
                  <div className="badge badge-secondary badge-outline">
                    daisyUI
                  </div>
                  <div className="badge badge-accent badge-outline">SEO</div>
                </div>
                <p className="mt-4 text-base-content/70">
                  Front + back unifiés, rendu SSR/ISR, contenus HTML chargés
                  côté serveur pour un référencement nickel ✨
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Derniers articles */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Derniers articles</h2>
          <Link href="/articles" className="link link-primary">
            Tout voir →
          </Link>
        </div>

        {latest.length === 0 ? (
          <div className="alert">
            <span>
              Aucun article pour le moment. Créez-en un depuis l’onglet
              Administration.
            </span>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <article
                key={a.slug}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  <h3 className="card-title leading-snug">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="link hover:no-underline"
                    >
                      {a.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {new Date(a.date).toLocaleDateString()} · {a.author}
                  </p>
                  <div className="card-actions justify-end mt-4">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="btn btn-sm btn-outline"
                    >
                      Lire →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* CTA bas de page */}
        <div className="mt-10 flex items-center justify-between border-t border-base-300 pt-6">
          <div className="text-base-content/60">
            {latest.length} article{latest.length > 1 ? "s" : ""} récent
            {latest.length > 1 ? "s" : ""}
          </div>
          <div className="flex gap-3">
            <Link href="/articles" className="btn btn-primary btn-sm">
              Explorer le blog
            </Link>
            <Link href="/admin" className="btn btn-ghost btn-sm">
              Administration
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
