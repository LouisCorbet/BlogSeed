"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteArticleButton from "./DeleteArticleButton"; // adapte si ton import est ailleurs
import { deleteArticle } from "../admin/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ArticlesTable({ articles }: { articles: any[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const totalPages = Math.ceil(sorted.length / perPage);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Articles existants</h2>
          <Link href="/articles" className="btn btn-ghost btn-sm">
            Voir le blog →
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="alert mt-2">
            <span>Aucun article pour le moment.</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Auteur</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((a) => (
                    <tr key={a.slug} className="hover">
                      <td>
                        {a.imgPath ? (
                          <Image
                            width={64}
                            height={64}
                            src={`/${a.imgPath}`}
                            alt={a.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-base-200 text-xs text-base-content/60 rounded">
                            N/A
                          </div>
                        )}
                      </td>

                      <td className="max-w-[280px]">
                        <div className="font-medium truncate">{a.title}</div>
                        <div className="text-xs text-base-content/60">
                          /{a.slug}
                        </div>
                      </td>
                      <td>{a.author}</td>
                      <td>{new Date(a.date).toLocaleDateString()}</td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/articles/${a.slug}`}
                            className="btn btn-xs btn-outline"
                          >
                            Voir
                          </Link>
                          <form action={deleteArticle}>
                            <input type="hidden" name="slug" value={a.slug} />
                            <DeleteArticleButton title={a.title} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Précédent
              </button>
              <span className="text-sm text-base-content/70">
                Page {page} / {totalPages}
              </span>
              <button
                className="btn btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
