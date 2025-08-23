"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4, v4 } from "uuid";

interface PostIndexEntry {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  imgPath: string; // chemin public de l'image (ex: /uploads/slug-123456.webp)
  imageAlt: string; // texte alternatif de l'image
  catchphrase?: string; // phrase d'accroche
}

const articlesDir = path.join(process.cwd(), "data/articles");
const indexFile = path.join(articlesDir, "index.json");
const imgDir = path.join(process.cwd(), "public/images");

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function sanitizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Ajout / édition d’un article avec image (facultative)
 * Champs attendus dans le FormData :
 * - slug, title, author, htmlContent, date? (YYYY-MM-DD ou ISO)
 * - image? (File), imageAlt? (string)
 */
export async function saveArticle(formData: FormData) {
  // Fields normalization

  const providedId = String(formData.get("id") ?? "");
  let oldArticle: PostIndexEntry | undefined;
  if (providedId) {
    try {
      const index = JSON.parse(
        await fs.readFile(indexFile, "utf-8")
      ) as PostIndexEntry[];
      oldArticle = index.find((p) => p.id === providedId);
    } catch {
      // Ignore errors
    }
  }

  const slug = providedId
    ? String(formData.get("slug") ?? "")
    : `${sanitizeSlug(String(formData.get("slug") ?? ""))}-${Date.now()}`;
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const htmlInput = String(formData.get("htmlContent") ?? "");
  const dateInput = String(formData.get("date") ?? "");
  const dateIso =
    dateInput && /^\d{4}-\d{2}-\d{2}/.test(dateInput)
      ? new Date(dateInput).toISOString()
      : new Date().toISOString();
  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const catchphrase = String(formData.get("catchphrase") ?? "").trim();
  const articleId = providedId || v4();

  // Make sure folders exist
  // await fs.mkdir(articlesDir, { recursive: true });
  await fs.mkdir(path.join(articlesDir, "html"), { recursive: true });
  await fs.mkdir(imgDir, { recursive: true });

  // Handle image errors
  const providedImage = formData.get("image");
  let fileName = "";
  if (providedImage instanceof File && providedImage.size > 0) {
    const mime = providedImage.type;
    const ext =
      MIME_TO_EXT[mime] ||
      path.extname(providedImage.name).replace(".", "").toLowerCase();
    if (!ext) {
      throw new Error(`Type d'image non pris en charge: ${mime || "inconnu"}`);
    }
    if (providedImage.size > 8 * 1024 * 1024) {
      throw new Error("Image trop lourde (max 8 Mo).");
    }

    // if slug changed, delete old image
    if (slug !== oldArticle?.slug) {
      const oldFileName = `${oldArticle?.slug}.${ext}`;
      await safeUnlink(path.join(imgDir, oldFileName));
    }

    // Image saving
    fileName = `${slug}.${ext}`;
    const fileBuffer = Buffer.from(await providedImage.arrayBuffer());
    const diskPath = path.join(imgDir, fileName);
    await fs.writeFile(diskPath, fileBuffer);
  } else if (!providedId) {
    throw new Error("Image manquante");
  }

  // if slug changed, delete old HTML
  if (slug !== oldArticle?.slug) {
    const oldHtmlPath = path.join(articlesDir, `html/${oldArticle?.slug}.html`);
    await safeUnlink(oldHtmlPath);
  }

  // HTML saving
  const htmlPath = path.join(articlesDir, `html/${slug}.html`);
  await fs.writeFile(htmlPath, htmlInput, "utf-8");

  // Index update
  //// Extract existing entries
  let index: PostIndexEntry[] = [];
  try {
    index = JSON.parse(
      await fs.readFile(indexFile, "utf-8")
    ) as PostIndexEntry[];
  } catch {
    index = [];
  }

  console.log();

  //// Replace/add ours
  const rest = index.filter((p) => p.id !== articleId);
  rest.push({
    id: v4(),
    slug,
    title,
    author,
    date: dateIso,
    imgPath: fileName !== "" ? `images/${fileName}` : oldArticle?.imgPath || "",
    imageAlt: imageAlt,
    catchphrase,
  });

  //// Update index.json
  await fs.writeFile(indexFile, JSON.stringify(rest, null, 2), "utf-8");

  // Revalidation ISR
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}

async function safeUnlink(p: string) {
  try {
    await fs.unlink(p);
  } catch {
    // fichier déjà absent : ignorer
  }
}

export async function deleteArticle(formData: FormData) {
  const slug = sanitizeSlug(String(formData.get("slug") ?? ""));
  if (!slug) return;

  // 1) Charger l'index
  let index: Array<{ slug: string; imgPath: string }> = [];
  try {
    index = JSON.parse(await fs.readFile(indexFile, "utf-8"));
  } catch {
    index = [];
  }

  // 2) Trouver l'article à supprimer (pour récupérer son image)
  const toDelete = index.find((p) => p.slug === slug);
  if (!toDelete) return;

  // 3) Supprimer le fichier HTML
  const htmlPath = path.join(articlesDir, `html/${slug}.html`);
  await safeUnlink(htmlPath);
  const imgPath = path.join(imgDir, path.basename(toDelete.imgPath));
  await safeUnlink(imgPath);

  // 4) Mettre à jour l'index.json (on retire l'entrée)
  const updated = index.filter((p) => p.slug !== slug);
  await fs.writeFile(indexFile, JSON.stringify(updated, null, 2), "utf-8");

  // 6) Revalidation ISR
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}
