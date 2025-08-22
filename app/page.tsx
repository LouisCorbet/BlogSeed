import Link from "next/link";
import { readIndex } from "@/lib/store";
import ArticleSearch from "./components/ArticlesSearch";
import Image from "next/image";

export default async function Home() {
  const all = await readIndex();

  return (
    <main className="min-h-screen bg-base-200">
      {/* Hero */}
      <section className="bg-base-100 hero border-b border-base-300">
        <div className="hero-content max-w-5xl w-full flex-col lg:flex-row gap-10 py-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              Mon <span className="text-primary">Blog</span>
            </h1>
            <p className="py-4 text-base-content/70">
              Derniers articles, guides et inspirations. Tout est servi léger,
              rapide, et SEO-friendly.
            </p>
          </div>
          <Image src="/favicon.ico" alt="Hero Image" width={200} height={200} />
        </div>
      </section>

      {/* 🔎 Section Recherche + Liste filtrée */}
      <ArticleSearch items={all} />
    </main>
  );
}
