"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

interface PostPayload {
  slug: string;
  title: string;
  author: string;
  htmlContent?: string;
  date?: string;
}

const articlesDir = path.join(process.cwd(), "data/articles");
const indexFile = path.join(articlesDir, "index.json");

/**
 * Ajout / édition d’un article
 */
export async function saveArticle(formData: FormData) {
  const payload: PostPayload = {
    slug: String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    author: String(formData.get("author") ?? "").trim(),
    htmlContent: String(formData.get("htmlContent") ?? ""),
    date: String(formData.get("date") ?? new Date().toISOString()),
  };

  console.log(articlesDir);
  await fs.mkdir(articlesDir, { recursive: true });

  // Sauvegarde HTML
  const htmlPath = path.join(articlesDir, `${payload.slug}.html`);
  await fs.writeFile(htmlPath, payload.htmlContent ?? "", "utf-8");

  // Mise à jour index.json
  let index: PostPayload[] = [];
  try {
    index = JSON.parse(await fs.readFile(indexFile, "utf-8"));
  } catch {
    index = [];
  }

  const withoutOld = index.filter((p) => p.slug !== payload.slug);
  withoutOld.push({ ...payload, htmlContent: undefined });
  await fs.writeFile(indexFile, JSON.stringify(withoutOld, null, 2), "utf-8");

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${payload.slug}`);
}

/**
 * Suppression d’un article
 */
export async function deleteArticle(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  if (!slug) return;

  // Supprimer fichier HTML
  const htmlPath = path.join(articlesDir, `${slug}.html`);
  try {
    await fs.unlink(htmlPath);
  } catch {
    // pas grave si fichier manquant
  }

  // MAJ index.json
  let index: PostPayload[] = [];
  try {
    index = JSON.parse(await fs.readFile(indexFile, "utf-8"));
  } catch {
    index = [];
  }

  const updated = index.filter((p) => p.slug !== slug);
  await fs.writeFile(indexFile, JSON.stringify(updated, null, 2), "utf-8");

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}
