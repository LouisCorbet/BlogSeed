import Link from "next/link";
import { readIndex } from "@/lib/store";

export default async function Articles() {
  const items = await readIndex();
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="min-h-screen bg-base-200">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tous les articles</h1>
            <p className="text-base-content/70">
              {sorted.length} article{sorted.length > 1 ? "s" : ""} publiés
            </p>
          </div>
          <input
            type="text"
            placeholder="Rechercher un article..."
            className="input input-bordered w-full sm:w-64"
          />
        </header>

        {sorted.length === 0 ? (
          <div className="alert">
            <span>Aucun article publié pour l’instant.</span>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((a) => (
              <article
                key={a.slug}
                className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  <h2 className="card-title leading-snug">
                    <Link
                      href={`/articles/${a.slug}`}
                      className="link hover:no-underline"
                    >
                      {a.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-base-content/60">
                    Publié le {new Date(a.date).toLocaleDateString()} par{" "}
                    <span className="font-medium">{a.author}</span>
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
      </section>
    </main>
  );
}
