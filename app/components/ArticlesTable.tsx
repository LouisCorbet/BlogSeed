"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import DeleteArticleButton from "./DeleteArticleButton";
import { deleteArticle } from "../admin/actions";

type Article = {
  id: string;
  slug: string;
  title: string;
  author: string;
  date?: string;
  imgPath?: string;
  imageAlt?: string;
};

export default function ArticlesTable({ articles }: { articles: Article[] }) {
  const [page, setPage] = useState(1);
  const perPage = 10;

  const sorted = useMemo(
    () =>
      [...articles].sort((a, b) => (b.date || "").localeCompare(a.date || "")),
    [articles]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const start = (page - 1) * perPage;
  const paginated = sorted.slice(start, start + perPage);

  const formatDate = (d?: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(+dt) ? "—" : dt.toLocaleDateString();
  };

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="card-title">Articles existants</h2>
          <Link
            href="/articles"
            className="btn btn-ghost btn-sm self-start sm:self-auto"
          >
            Voir le blog →
          </Link>
        </div>

        {/* Empty state */}
        {articles.length === 0 ? (
          <div className="alert mt-3">
            <span>Aucun article pour le moment.</span>
          </div>
        ) : (
          <>
            {/* ===== Mobile: cards list ===== */}
            <ul className="md:hidden grid gap-3 mt-3">
              {paginated.map((a) => (
                <li key={a.slug} className="rounded border border-base-300 p-3">
                  <div className="flex items-start gap-3">
                    {/* Image */}
                    <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden bg-base-200 border border-base-300">
                      {a.imgPath ? (
                        <Image
                          src={a.imgPath}
                          alt={a.imageAlt || a.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                          priority={false}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-xs text-base-content/60">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Texts */}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.title}</div>
                      <div className="text-xs text-base-content/60 truncate">
                        /{a.slug}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="opacity-70">{a.author || "—"}</span> ·{" "}
                        {formatDate(a.date)}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <Link
                          href={`/articles/${a.slug}`}
                          className="btn btn-xs btn-outline col-span-1"
                        >
                          Voir
                        </Link>
                        <Link
                          href={`/admin?edit=${encodeURIComponent(
                            a.slug
                          )}#article-form`}
                          className="btn btn-xs col-span-1"
                          prefetch={false}
                          title="Modifier cet article"
                        >
                          Modifier
                        </Link>
                        <form action={deleteArticle} className="col-span-1">
                          <input type="hidden" name="slug" value={a.slug} />
                          <DeleteArticleButton
                            title={a.title}
                            size="xs"
                            className="w-full"
                          />
                        </form>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* ===== Desktop: table ===== */}
            <div className="hidden md:block overflow-x-auto mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-[80px]">Image</th>
                    <th>Titre</th>
                    <th className="whitespace-nowrap">Auteur</th>
                    <th className="whitespace-nowrap">Date</th>
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
                            src={a.imgPath}
                            alt={a.imageAlt || a.title}
                            className="w-16 h-16 object-cover rounded border border-base-300"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-16 h-16 flex items-center justify-center bg-base-200 text-xs text-base-content/60 rounded border border-base-300">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="max-w-[360px]">
                        <div className="font-medium truncate">{a.title}</div>
                        <div className="text-xs text-base-content/60 truncate">
                          /{a.slug}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">{a.author || "—"}</td>
                      <td className="whitespace-nowrap">
                        {formatDate(a.date)}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/articles/${a.slug}`}
                            className="btn btn-xs btn-outline"
                          >
                            Voir
                          </Link>
                          <Link
                            href={`/admin?edit=${encodeURIComponent(
                              a.slug
                            )}#article-form`}
                            className="btn btn-xs"
                            prefetch={false}
                            title="Modifier cet article"
                          >
                            Modifier
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <button
                className="btn btn-sm w-full sm:w-auto"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Précédent
              </button>

              <span className="text-sm text-base-content/70">
                Page {page} / {totalPages}
              </span>

              <button
                className="btn btn-sm w-full sm:w-auto"
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
