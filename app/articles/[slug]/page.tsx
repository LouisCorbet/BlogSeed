import { readIndex, getHTML } from "@/lib/store";
import { notFound } from "next/navigation";

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

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <article>
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{meta.title}</h1>
          <p className="text-sm text-gray-500">
            Par {meta.author} — {new Date(meta.date).toLocaleDateString()}
          </p>
        </header>
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
