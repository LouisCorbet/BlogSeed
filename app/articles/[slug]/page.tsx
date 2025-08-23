import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { readIndex, getHTML } from "@/lib/store";
import SuggestCarousel, { SuggestItem } from "@/app/components/SuggestCarousel";

function formatDateISOFrUTC(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

// shuffle simple avec Math.random()
function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export default async function ArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const list = await readIndex();
  const meta = list.find((a) => a.slug === slug);
  const html = await getHTML(slug);
  if (!meta || !html) return notFound();

  // “Voir aussi” : 6 articles aléatoires, hors article courant
  const others = list.filter((a) => a.slug !== slug);
  const suggestions: SuggestItem[] = pickRandom(
    others,
    Math.min(6, others.length)
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
                alt={meta.title}
                width={300}
                height={300}
                className="w-[90vw] md:w-[300px] h-auto object-contain rounded-xl"
                priority
              />
            )}

            {/* Texte */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">
                {meta.title}
              </h1>
              <p className="mt-3 text-sm text-base-content/60">
                Publié le {formatDateISOFrUTC(meta.date)} — par{" "}
                <span className="font-medium">{meta.author}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <article className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div
              className="prose max-w-none"
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

          <SuggestCarousel items={suggestions} />
        </section>
      )}
    </main>
  );
}
