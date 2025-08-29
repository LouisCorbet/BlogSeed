"use client";

import { useEffect, useMemo, useState } from "react";
import ArticleCard from "./ArticleCard";
import { Article } from "@/lib/store";

export default function ArticleSearch({ items }: { items: Article[] }) {
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // debounce 300ms
  useEffect(() => {
    const id = setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(id);
  }, [rawQuery]);

  // reset page quand la recherche change
  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const base = [...items].sort((a, b) => b.date.localeCompare(a.date));
    if (!query) return base;
    return base.filter((a) => a.title.toLowerCase().includes(query));
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = filtered.slice((page - 1) * perPage, page * perPage);

  // util: créer une petite pagination numérique (bornée)
  const pageNumbers = useMemo(() => {
    const span = 5; // nb max de numéros affichés
    const half = Math.floor(span / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + span - 1);
    start = Math.max(1, Math.min(start, end - span + 1));
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="text-base-content/60">
          {rawQuery ? filtered.length : items.length} article
          {(rawQuery ? filtered.length : items.length) > 1 ? "s" : ""}{" "}
          {rawQuery ? `trouvé${filtered.length > 1 ? "s" : ""}` : ""}
        </div>

        <input
          type="text"
          placeholder="Chercher un article"
          className="input input-bordered w-full sm:w-80"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="alert">
          <span>Aucun résultat pour « {rawQuery} ».</span>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {current.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="join">
              <button
                className="btn btn-sm join-item"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Précédent
              </button>

              {pageNumbers.map((n) => (
                <button
                  key={n}
                  className={`btn btn-sm join-item ${
                    n === page ? "btn-primary" : ""
                  }`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}

              <button
                className="btn btn-sm join-item"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant →
              </button>
            </div>

            <div className="text-xs text-base-content/60">
              Affichage {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, filtered.length)} sur {filtered.length}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
