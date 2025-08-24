import { readIndex, getHTML, Article } from "@/lib/store";
import ArticlesTable from "../components/ArticlesTable";
import ArticleForm from "../components/ArticleForm";
import SiteSettingsForm from "../components/SiteSettingsForm";
import { readSiteSettings } from "@/lib/siteSettings";

type AdminSearchParams = {
  edit?: string | string[] | undefined;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const { edit } = await searchParams; // ✅ attendre searchParams
  const editSlug = Array.isArray(edit) ? edit[0] : edit;
  const [articles, settings] = await Promise.all([
    readIndex(),
    readSiteSettings(),
  ]);

  const editing = editSlug
    ? articles.find((a: Article) => a.slug === editSlug)
    : undefined;

  const html = editing ? await getHTML(editing.slug) : undefined;

  return (
    <main className="min-h-screen bg-base-200">
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-2 gap-8">
        <ArticleForm
          article={editing ? { ...editing, html: html ?? "" } : undefined}
        />
      </section>
      <section>
        <ArticlesTable articles={articles} />
      </section>
      <section>
        <SiteSettingsForm settings={settings} />
      </section>
    </main>
  );
}
