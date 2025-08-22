import { saveArticle, deleteArticle } from "./actions";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";

import { readIndex } from "@/lib/store";
import DeleteArticleButton from "../components/DeleteArticleButton";
import Image from "next/image";
import ArticlesTable from "../components/ArticlesTable";
import ArticleForm from "../components/ArticleForm";
export default async function AdminPage() {
  const articles = await readIndex();
  const count = articles.length;
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="min-h-screen bg-base-200">
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid lg:grid-cols-2 gap-8">
        <ArticleForm />
        <ArticlesTable articles={articles} />
      </section>
    </main>
  );
}
