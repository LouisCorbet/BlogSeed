// app/articles/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { readIndex, getHTML } from "@/lib/store";

export const revalidate = 600; // régénère toutes les 10 min

export async function generateStaticParams() {
  const list = await readIndex();
  return list.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const list = await readIndex();
  const meta = list.find((a) => a.slug === params.slug);
  if (!meta) return { title: "Article introuvable" };

  return {
    title: meta.title,
    description: `${meta.title} — par ${meta.author}`,
    alternates: { canonical: `/articles/${meta.slug}` },
    openGraph: {
      type: "article",
      title: meta.title,
      authors: [meta.author],
      publishedTime: meta.date,
      url: `/articles/${meta.slug}`,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const list = await readIndex();
  const meta = list.find((a) => a.slug === params.slug);
  const html = await getHTML(params.slug);

  if (!meta || !html) return notFound();

  // lecture estimée (≈200 mots/min)
  const plain = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  const readMin = Math.max(1, Math.round(words / 200));

  // tri par date pour trouver précédent / suivant
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));
  const idx = sorted.findIndex((a) => a.slug === meta.slug);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  // URL absolue (si tu as défini NEXT_PUBLIC_BASE_URL)
  const origin = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const absoluteUrl = `${origin}/articles/${meta.slug}`;

  return (
    <main className="min-h-screen bg-base-200">
      {/* barre top + breadcrumbs */}
      <div className="navbar bg-base-100 border-b border-base-300">
        <div className="max-w-5xl mx-auto w-full px-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Link href="/">Accueil</Link>
              </li>
              <li>
                <Link href="/articles">Articles</Link>
              </li>
              <li className="truncate max-w-[240px]">{meta.title}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* header article */}
      <section className="bg-base-100">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {meta.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-base-content/70">
            <span className="badge badge-outline">
              Publié le {new Date(meta.date).toLocaleDateString()}
            </span>
            <span className="badge badge-outline">Par {meta.author}</span>
            <span className="badge badge-outline">
              {readMin} min de lecture
            </span>
          </div>

          {/* boutons de partage */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="btn btn-sm btn-outline"
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                absoluteUrl
              )}&text=${encodeURIComponent(meta.title)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Partager X/Twitter
            </a>
            <a
              className="btn btn-sm btn-outline"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                absoluteUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Partager Facebook
            </a>
            {/* <button
              className="btn btn-sm btn-ghost"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(absoluteUrl);
                  alert("Lien copié dans le presse-papiers ✅");
                } catch {
                  alert("Impossible de copier le lien");
                }
              }}
            >
              Copier le lien
            </button> */}
          </div>
        </div>
      </section>

      {/* contenu */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <article className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </article>

        {/* nav précédent / suivant */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body">
              <span className="text-xs text-base-content/60">
                Article précédent
              </span>
              {prev ? (
                <Link
                  href={`/articles/${prev.slug}`}
                  className="card-title text-base leading-tight link hover:no-underline"
                >
                  ← {prev.title}
                </Link>
              ) : (
                <span className="text-base-content/50">Aucun</span>
              )}
            </div>
          </div>
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body text-right">
              <span className="text-xs text-base-content/60">
                Article suivant
              </span>
              {next ? (
                <Link
                  href={`/articles/${next.slug}`}
                  className="card-title text-base leading-tight link hover:no-underline"
                >
                  {next.title} →
                </Link>
              ) : (
                <span className="text-base-content/50">Aucun</span>
              )}
            </div>
          </div>
        </div>

        {/* retour */}
        <div className="mt-8 flex items-center justify-between border-t border-base-300 pt-6">
          <Link href="/articles" className="btn btn-ghost btn-sm">
            ← Tous les articles
          </Link>
          <Link href="/admin" className="btn btn-outline btn-sm">
            Administration
          </Link>
        </div>
      </section>
    </main>
  );
}
