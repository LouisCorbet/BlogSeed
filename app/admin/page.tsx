// app/admin/page.tsx
import { readIndexAdmin, getHTML, Article } from "@/lib/store";
import { readSiteSettings } from "@/lib/siteSettings.server";
import ArticleForm from "../components/ArticleForm";
import ArticlesTable from "../components/ArticlesTable";
import SiteSettingsForm from "../components/SiteSettingsForm";
import AutoPublishSettingsForm from "../components/AutoPublishSettingsForm";
import AdminTabs from "../components/AdminTabs";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type AdminSearchParams = {
  edit?: string | string[] | undefined;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const { edit } = await searchParams;
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
      {/* Header */}
      <section className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Administration
              </h1>
              <p className="text-base-content/70">
                Gérez vos articles et l&apos;identité du site.
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

      {/* Tabs via hash (#creation, #articles, #identity, #autopub) */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <AdminTabs
          articles={articles}
          settings={settings}
          editing={editing}
          editingHtml={html ?? ""}
        >
          {{
            creation: (
              <ArticleForm
                key={editing?.id ?? "new"}
                article={editing ? { ...editing, html: html ?? "" } : undefined}
              />
            ),
            articles: <ArticlesTable articles={articles} />,
            identity: <SiteSettingsForm settings={settings} />,
            autopub: <AutoPublishSettingsForm settings={settings} />,
          }}
        </AdminTabs>
      </section>
    </main>
  );
}
