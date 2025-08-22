import { saveArticle, deleteArticle } from "./actions";
import fs from "fs/promises";
import Link from "next/link";
import path from "path";

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

  return (
    <div style={{ padding: "2rem" }}>
      <Link href="/" className="text-blue-600 underline">
        Retour à l&apos;accueil
      </Link>
      <h1>Administration</h1>

      {/* --- Formulaire d’ajout --- */}
      <h2>Nouvel Article</h2>
      <form
        action={saveArticle}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "600px",
        }}
      >
        <input
          type="text"
          name="slug"
          placeholder="slug (ex: mon-article)"
          required
        />
        <input type="text" name="title" placeholder="Titre" required />
        <input type="text" name="author" placeholder="Auteur" required />
        <textarea
          name="htmlContent"
          placeholder="Contenu HTML"
          rows={10}
          required
        />
        <input type="date" name="date" />
        <button type="submit">Enregistrer</button>
      </form>

      {/* --- Liste des articles existants --- */}
      <h2 style={{ marginTop: "2rem" }}>Articles existants</h2>
      {articles.length === 0 && <p>Aucun article</p>}
      <ul>
        {articles.map((a) => (
          <li key={a.slug} style={{ marginBottom: "1rem" }}>
            <strong>{a.title}</strong> — {a.author} ({a.date})
            <form
              action={deleteArticle}
              style={{ display: "inline", marginLeft: "1rem" }}
            >
              <input type="hidden" name="slug" value={a.slug} />
              <button type="submit" style={{ color: "red" }}>
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
