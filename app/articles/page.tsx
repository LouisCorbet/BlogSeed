import Link from "next/link";
import { readIndex } from "@/lib/store";
import ArticleCard from "../components/ArticleCard";

export default async function Articles({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const items = await readIndex();
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));

  // Pagination
  const page = parseInt(searchParams?.page || "1", 10);
  const perPage = 10;
  const totalPages = Math.ceil(sorted.length / perPage);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

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
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-10">
              {page > 1 && (
                <Link
                  href={`/articles?page=${page - 1}`}
                  className="btn btn-sm"
                >
                  ← Précédent
                </Link>
              )}
              <span className="text-sm text-base-content/70">
                Page {page} sur {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/articles?page=${page + 1}`}
                  className="btn btn-sm"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
