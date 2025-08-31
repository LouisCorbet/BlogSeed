import { readIndexAdmin, getHTML, Article } from "@/lib/store";
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
    readIndexAdmin(),
    readSiteSettings(),
  ]);

  const editing = editSlug
    ? articles.find((a: Article) => a.slug === editSlug)
    : undefined;
  const html = editing ? await getHTML(editing.slug) : undefined;

  return (
    <main className="min-h-screen bg-base-200">
      {/* Hero / Header */}
      <section className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Administration
              </h1>
              <p className="text-base-content/70">
                Gérez vos articles et l’apparence du site.{" "}
                {editing && (
                  <span className="ml-1 badge badge-primary align-middle">
                    Édition : {editing.slug}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Articles table */}
        <section id="articles">
          <ArticleForm
            key={editing?.id ?? "new"}
            article={editing ? { ...editing, html: html ?? "" } : undefined}
          />
        </section>

        {/* Articles table */}
        <section id="articles">
          <ArticlesTable articles={articles} />
        </section>

        <section id="articles">
          <SiteSettingsForm settings={settings} />
        </section>
      </section>
    </main>
  );
}
