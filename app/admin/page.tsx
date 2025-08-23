import { readIndex } from "@/lib/store";
import ArticlesTable from "../components/ArticlesTable";
import ArticleForm from "../components/ArticleForm";
export default async function AdminPage() {
  const articles = await readIndex();

  return (
    <main className="min-h-screen bg-base-200">
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-2 gap-8">
        <ArticleForm />
        <ArticlesTable articles={articles} />
      </section>
    </main>
  );
}
