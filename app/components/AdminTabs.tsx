// app/admin/components/AdminTabs.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import type { Article } from "@/lib/store";
import type { SiteSettings } from "@/lib/siteSettings";
import { FileEdit, List, Brush, CalendarClock } from "lucide-react";

type Props = {
  articles: Article[];
  settings: SiteSettings;
  editing?: Article;
  editingHtml?: string;
  children: {
    edit: React.ReactNode;
    articles: React.ReactNode;
    appearance: React.ReactNode;
    autopub: React.ReactNode;
  };
};

const TAB_IDS = ["edit", "articles", "appearance", "autopub"] as const;
type TabId = (typeof TAB_IDS)[number];

function normalizeHash(hash: string | null): `#${TabId}` {
  const clean = (hash || "#edit").toLowerCase();
  if (clean === "#articles") return "#articles";
  if (clean === "#appearance") return "#appearance";
  if (clean === "#autopub") return "#autopub";
  return "#edit";
}

export default function AdminTabs(props: Props) {
  const [hash, setHash] = useState<`#${TabId}`>("#edit");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // init + listen hash
  useEffect(() => {
    setHash(
      normalizeHash(
        typeof window !== "undefined" ? window.location.hash : "#edit"
      )
    );
    const onHash = () => setHash(normalizeHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // resync on Next route changes
  useEffect(() => {
    setHash(
      normalizeHash(
        typeof window !== "undefined" ? window.location.hash : "#edit"
      )
    );
  }, [pathname, searchParams?.toString()]);

  // remove ?edit=... when not on #edit
  useEffect(() => {
    const hasEditParam = !!searchParams?.get("edit");
    if (hasEditParam && hash !== "#edit") {
      router.replace(`${pathname}${hash}`, { scroll: false });
    }
  }, [hash, pathname, router, searchParams]);

  const isActive = (id: TabId) => hash === (`#${id}` as const);
  const articlesCount = useMemo(
    () => props.articles?.length ?? 0,
    [props.articles]
  );

  return (
    <div className="space-y-4">
      {/* PILL TABS */}
      <nav className="flex items-center justify-start overflow-x-auto no-scrollbar">
        <div className="tabs tabs-boxed p-1 gap-2">
          <a
            href="#edit"
            role="tab"
            className={`tab gap-2 rounded-xl px-4 py-2 transition ${
              isActive("edit") ? "tab-active bg-base-300" : "hover:bg-base-300"
            }`}
            aria-controls="panel-edit"
            title="Édition"
          >
            <FileEdit className="w-4 h-4" />
            <span>Édition</span>
          </a>

          <a
            href="#articles"
            role="tab"
            className={`tab gap-2 rounded-xl px-4 py-2 transition ${
              isActive("articles")
                ? "tab-active  bg-base-300"
                : "hover:bg-base-300"
            }`}
            aria-controls="panel-articles"
            title="Articles"
          >
            <List className="w-4 h-4" />
            <span>Articles</span>
            <span className="badge badge-sm ml-1">{articlesCount}</span>
          </a>

          <a
            href="#appearance"
            role="tab"
            className={`tab gap-2 rounded-xl px-4 py-2 transition ${
              isActive("appearance")
                ? "tab-active  bg-base-300"
                : "hover:bg-base-300"
            }`}
            aria-controls="panel-appearance"
            title="Apparence"
          >
            <Brush className="w-4 h-4" />
            <span>Apparence</span>
          </a>

          <a
            href="#autopub"
            role="tab"
            className={`tab gap-2 rounded-xl px-4 py-2 transition ${
              isActive("autopub")
                ? "tab-active  bg-base-300"
                : "hover:bg-base-300"
            }`}
            aria-controls="panel-autopub"
            title="Publication auto"
          >
            <CalendarClock className="w-4 h-4" />
            <span>Publication auto</span>
          </a>
        </div>
      </nav>

      {/* PANELS */}
      <div
        id="edit"
        role="tabpanel"
        aria-labelledby="tab-edit"
        className={`rounded-box bg-base-100 border border-base-300 p-6 shadow-sm ${
          isActive("edit") ? "block" : "hidden"
        }`}
      >
        {props.children.edit}
      </div>

      <div
        id="articles"
        role="tabpanel"
        aria-labelledby="tab-articles"
        className={`rounded-box bg-base-100 border border-base-300 p-6 shadow-sm ${
          isActive("articles") ? "block" : "hidden"
        }`}
      >
        {props.children.articles}
      </div>

      <div
        id="appearance"
        role="tabpanel"
        aria-labelledby="tab-appearance"
        className={`rounded-box bg-base-100 border border-base-300 p-6 shadow-sm ${
          isActive("appearance") ? "block" : "hidden"
        }`}
      >
        {props.children.appearance}
      </div>

      <div
        id="autopub"
        role="tabpanel"
        aria-labelledby="tab-autopub"
        className={`rounded-box bg-base-100 border border-base-300 p-6 shadow-sm ${
          isActive("autopub") ? "block" : "hidden"
        }`}
      >
        {props.children.autopub}
      </div>
    </div>
  );
}
