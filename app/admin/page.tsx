import { saveArticle, deleteArticle } from "./actions";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";

async function getArticles() {
  const articlesDir = path.join(process.cwd(), "articles");
  const indexFile = path.join(articlesDir, "index.json");

  try {
    const raw = await fs.readFile(indexFile, "utf-8");
    return JSON.parse(raw) as {
      slug: string;
      title: string;
      author: string;
      date: string;
    }[];
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const articles = await getArticles();
  const count = articles.length;

  return (
    <main className="min-h-screen bg-base-200">
      {/* Breadcrumb / Header */}
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="max-w-6xl mx-auto w-full px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="btn btn-ghost">
              Accueil
            </Link>
            <div className="breadcrumbs text-sm">
              <ul>
                <li>
                  <Link href="/">Accueil</Link>
                </li>
                <li>Administration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="hero bg-base-100">
        <div className="hero-content flex-col lg:flex-row-reverse max-w-6xl w-full gap-10">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold">Administration</h1>
            <p className="py-2 text-base-content/70">
              Crée, édite et supprime des articles HTML. Les pages publiques
              sont régénérées automatiquement (ISR) après chaque action.
            </p>
            <div className="badge badge-primary badge-outline">
              {count} article{count > 1 ? "s" : ""} au total
            </div>
          </div>
          <div className="w-full">
            <div className="mockup-window border bg-base-300">
              <div className="bg-base-200 px-6 py-6">
                <p className="text-base-content/70">
                  <span className="font-semibold">Astuce :</span> utilise un{" "}
                  <code className="kbd kbd-sm">slug</code> en minuscules, séparé
                  par des tirets. Le champ <em>date</em> est optionnel (ISO sera
                  utilisé par défaut).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-2 gap-8">
        {/* Formulaire nouvel article */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Nouvel article</h2>
            <p className="text-sm text-base-content/70">
              Renseigne les métadonnées et colle le <strong>HTML</strong> de
              l’article.
            </p>

            <form action={saveArticle} className="grid gap-3">
              <label className="form-control">
                <span className="label">
                  <span className="label-text">Slug</span>
                  <span className="label-text-alt text-base-content/60">
                    ex. mon-article
                  </span>
                </span>
                <input
                  type="text"
                  name="slug"
                  placeholder="mon-article"
                  required
                  pattern="[a-z0-9-]+"
                  className="input input-bordered"
                />
              </label>

              <label className="form-control">
                <span className="label">
                  <span className="label-text">Titre</span>
                </span>
                <input
                  type="text"
                  name="title"
                  placeholder="Titre de l’article"
                  required
                  className="input input-bordered"
                />
              </label>

              <label className="form-control">
                <span className="label">
                  <span className="label-text">Auteur</span>
                </span>
                <input
                  type="text"
                  name="author"
                  placeholder="Nom de l’auteur"
                  required
                  className="input input-bordered"
                />
              </label>

              <label className="form-control">
                <span className="label">
                  <span className="label-text">Date (optionnelle)</span>
                  <span className="label-text-alt text-base-content/60">
                    YYYY-MM-DD
                  </span>
                </span>
                <input
                  type="date"
                  name="date"
                  className="input input-bordered"
                />
              </label>

              <label className="form-control">
                <span className="label">
                  <span className="label-text">Contenu HTML</span>
                </span>
                <textarea
                  name="htmlContent"
                  rows={12}
                  placeholder="<h1>Mon Titre</h1><p>Mon contenu…</p>"
                  required
                  className="textarea textarea-bordered font-mono"
                />
              </label>

              <div className="card-actions justify-end pt-2">
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Liste des articles */}
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
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Auteur</th>
                      <th>Date</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((a) => (
                        <tr key={a.slug} className="hover">
                          <td className="max-w-[280px]">
                            <div className="font-medium truncate">
                              {a.title}
                            </div>
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
                                <input
                                  type="hidden"
                                  name="slug"
                                  value={a.slug}
                                />
                                <button
                                  type="submit"
                                  className="btn btn-xs btn-error"
                                  onClick={(e) => {
                                    if (!confirm(`Supprimer "${a.title}" ?`))
                                      e.preventDefault();
                                  }}
                                >
                                  Supprimer
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
