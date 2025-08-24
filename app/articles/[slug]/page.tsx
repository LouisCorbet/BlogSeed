// app/articles/[slug]/page.tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { readIndex, getHTML, type Article } from "@/lib/store";
import SuggestCarousel from "@/app/components/SuggestCarousel";
import {
  buildArticleMetadata,
  ArticleJsonLd,
  type ArticleMeta,
} from "@/lib/seo";

// --- Static params (SSG) ---
export async function generateStaticParams() {
  const articles = await readIndex();
  return articles.map((a: Article) => ({ slug: a.slug }));
}

// --- Metadata (await params !) ---
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const articles = await readIndex();
  const meta = articles.find((a: Article) => a.slug === slug);
  const html = meta ? await getHTML(slug) : "";

  const a: ArticleMeta = {
    slug: meta?.slug ?? slug,
    title: meta?.title ?? slug,
    author: meta?.author,
    date: meta?.date,
    catchphrase: meta?.catchphrase,
    imgPath: meta?.imgPath,
    imageAlt: meta?.imageAlt || meta?.title || meta?.slug,
    html: html || "",
  };

  return buildArticleMetadata(a);
}

// --- Utils ---
function formatDateISOFrUTC(iso?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// --- Page ---
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const list = await readIndex();
  const meta = list.find((a) => a.slug === slug);
  const html = meta ? await getHTML(slug) : null;

  if (!meta || !html) return notFound();

  // Voir aussi : jusqu'à 6 articles au hasard (hors article courant)
  const suggestions = pickRandom(
    list.filter((a) => a.slug !== slug),
    Math.min(6, Math.max(0, list.length - 1))
  );

  return (
    <main className="bg-base-200">
      {/* Header visuel */}
      <section className="bg-base-100 border-b border-base-300">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
          <div className="grid md:grid-cols-2 gap-6 items-center justify-items-center md:justify-items-start">
            {/* Image */}
            {meta.imgPath && (
              <Image
                src={`/${meta.imgPath}`}
                alt={meta.imageAlt || meta.title || meta.slug}
                width={300}
                height={300}
                sizes="(min-width: 768px) 300px, 90vw"
                className="w-[90vw] md:w-[300px] h-auto object-contain rounded-xl"
                priority
              />
            )}

            {/* Texte */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {meta.title}
              </h1>
              {(meta.date || meta.author) && (
                <p className="mt-3 text-sm text-base-content/60">
                  {meta.date && <>Publié le {formatDateISOFrUTC(meta.date)}</>}
                  {meta.date && meta.author && " — "}
                  {meta.author && (
                    <>
                      par <span className="font-medium">{meta.author}</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* JSON-LD pour résultats enrichis */}
        <ArticleJsonLd
          a={{
            slug: meta.slug,
            title: meta.title,
            author: meta.author,
            date: meta.date,
            catchphrase: meta.catchphrase,
            imgPath: meta.imgPath,
            imageAlt: meta.imageAlt || meta.title,
            html, // utile pour la description
          }}
        />

        <article className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body">
            <div
              className="prose prose-neutral md:prose-lg max-w-none
                         prose-headings:font-semibold
                         prose-a:text-primary hover:prose-a:opacity-90
                         prose-img:rounded-xl
                         prose-code:bg-base-200 prose-code:px-1.5 prose-code:rounded
                         prose-pre:bg-base-200 prose-pre:border prose-pre:border-base-300
                         prose-hr:border-base-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </article>
      </section>

      {/* Voir aussi */}
      {suggestions.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Voir aussi</h2>
            <Link href="/" className="link link-primary">
              Tous les articles →
            </Link>
          </div>
          <SuggestCarousel items={suggestions as Article[]} />
        </section>
      )}
    </main>
  );
}
