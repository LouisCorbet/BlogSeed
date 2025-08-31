"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import {
  DaisyThemes,
  readSiteSettings,
  writeSiteSettings,
  type SiteSettings,
} from "@/lib/siteSettings";

interface PostIndexEntry {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  imgPath: string; // ex: /images/slug-123456.webp
  imageAlt: string;
  catchphrase?: string;
}

const dataDir = path.join(process.cwd(), "data");
const articlesDir = path.join(dataDir, "articles");
const htmlDir = path.join(articlesDir, "html");
const indexFile = path.join(articlesDir, "index.json");
const imgDir = path.join(dataDir, "images"); // ⬅️ DOIT matcher ta route /images

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

async function ensureDirs() {
  await fs.mkdir(htmlDir, { recursive: true, mode: 0o755 });
  await fs.mkdir(imgDir, { recursive: true, mode: 0o755 });
}

async function atomicWrite(
  filePath: string,
  data: string | Buffer,
  mode?: number
) {
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, data, mode ? { mode } : undefined);
  await fs.rename(tmp, filePath);
}

async function readIndexSafe(): Promise<PostIndexEntry[]> {
  try {
    const raw = await fs.readFile(indexFile, "utf-8");
    return JSON.parse(raw) as PostIndexEntry[];
  } catch {
    return [];
  }
}

async function safeUnlink(p: string) {
  try {
    await fs.unlink(p);
  } catch {}
}

/**
 * Ajout / édition d’un article (image facultative)
 * Fields attendus :
 * - slug, title, author, htmlContent, date? (YYYY-MM-DD, DD/MM/YYYY ou ISO)
 * - image? (File), imageAlt?, catchphrase?
 * - id? (pour édition)
 */
export async function saveArticle(formData: FormData) {
  await ensureDirs();

  const providedId = String(formData.get("id") ?? "");
  const index = await readIndexSafe();
  const oldArticle = providedId
    ? index.find((p) => p.id === providedId)
    : undefined;

  // slug
  const baseSlug = String(formData.get("slug") ?? "");
  const slug = providedId
    ? baseSlug // édition: on prend ce qui est fourni (tu peux forcer sanitize si tu veux)
    : `${sanitizeSlug(baseSlug)}-${Date.now()}`;

  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const htmlInput = String(formData.get("htmlContent") ?? "");

  // --- DATE: parsing robuste + comportement création/édition ---
  const dateInputRaw = String(formData.get("date") ?? "").trim();

  const toISO = (input: string, fallback?: string) => {
    if (!input) return fallback ?? new Date().toISOString();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      return new Date(`${input}T00:00:00.000Z`).toISOString();
    }
    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
      const [d, m, y] = input.split("/");
      return new Date(`${y}-${m}-${d}T00:00:00.000Z`).toISOString();
    }
    // ISO complet ou autre chaîne parseable par Date
    const t = Date.parse(input);
    if (!Number.isNaN(t)) return new Date(t).toISOString();

    // fallback si parsing impossible
    return fallback ?? new Date().toISOString();
  };

  // En création: si rien fourni -> now ; en édition: si rien fourni -> conserver l'ancienne date
  const dateIso = toISO(dateInputRaw, oldArticle?.date);
  // --- fin date ---

  const imageAlt = String(formData.get("imageAlt") ?? "").trim();
  const catchphrase = String(formData.get("catchphrase") ?? "").trim();
  const articleId = providedId || uuidv4();

  // Image
  const providedImage = formData.get("image");
  let fileName = "";
  if (providedImage instanceof File && providedImage.size > 0) {
    const mime = providedImage.type;
    const ext =
      MIME_TO_EXT[mime] ||
      path.extname(providedImage.name).replace(".", "").toLowerCase();
    if (!ext)
      throw new Error(`Type d'image non pris en charge: ${mime || "inconnu"}`);
    if (providedImage.size > 8 * 1024 * 1024)
      throw new Error("Image trop lourde (max 8 Mo).");

    // si le slug change, supprime l’ancienne image via son chemin connu (robuste si l’extension a changé)
    if (oldArticle?.imgPath && slug !== oldArticle.slug) {
      const oldBasename = path.basename(oldArticle.imgPath); // ex: slug-123.webp
      await safeUnlink(path.join(imgDir, oldBasename));
    }

    fileName = `${slug}.${ext}`;
    const diskPath = path.join(imgDir, fileName);
    const buf = Buffer.from(await (providedImage as File).arrayBuffer());

    await atomicWrite(diskPath, buf, 0o644);

    // pas indispensable si ta route /images est dynamic+revalidate=0, mais OK
    revalidatePath(`/images/${fileName}`);
  } else if (!providedId) {
    // création sans image
    throw new Error("Image manquante");
  }

  // si le slug change, supprime l’ancien HTML
  if (oldArticle && slug !== oldArticle.slug) {
    await safeUnlink(path.join(htmlDir, `${oldArticle.slug}.html`));
  }

  // HTML
  const htmlPath = path.join(htmlDir, `${slug}.html`);
  await atomicWrite(htmlPath, htmlInput, 0o644);

  // Index
  const updated: PostIndexEntry = {
    id: articleId, // conserve l’ID (pas de nouveau v4 à chaque édition)
    slug,
    title,
    author,
    date: dateIso,
    imgPath: fileName ? `/images/${fileName}` : oldArticle?.imgPath ?? "",
    imageAlt,
    catchphrase,
  };

  const rest = index.filter((p) => p.id !== articleId);
  rest.push(updated);
  await atomicWrite(indexFile, JSON.stringify(rest, null, 2), 0o644);

  // Revalidation ISR (si tu as des pages SSG/ISR)
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}

// Optionnel : limite de 8 Mo
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/**
 * Écrit une image de paramétrage (OG / logos) dans data/images
 * et retourne UNE URL publique sous /images/...
 */
async function changeImgSetting({
  formData,
  inputName,
  settingName,
  defaultFilename,
  currentFilePath,
}: {
  formData: FormData;
  inputName: string;
  settingName: string;
  defaultFilename: string;
  currentFilePath: string;
}): Promise<string> {
  const file = formData.get(inputName) as File | null;
  if (!file || file.size === 0) return currentFilePath;

  if (file.size > MAX_FILE_BYTES)
    throw new Error("Fichier trop volumineux (max 8 Mo).");

  // supprimer l’ancienne si connue
  const settings: SiteSettings = await readSiteSettings();
  const oldUrl = (settings as Record<string, unknown>)[settingName] as
    | string
    | undefined; // ex: /images/header-logo.png
  if (oldUrl) {
    const oldBase = path.join(imgDir, path.basename(oldUrl));
    await safeUnlink(oldBase);
  }

  // écrire la nouvelle
  await fs.mkdir(imgDir, { recursive: true, mode: 0o755 });
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const fname = `${defaultFilename}.${ext}`;
  const dst = path.join(imgDir, fname);
  const buf = Buffer.from(await file.arrayBuffer());

  await atomicWrite(dst, buf, 0o644);
  return `/images/${fname}`;
}

export async function saveSiteSettings(formData: FormData) {
  const tagline = String(formData.get("tagline") ?? "").trim();
  const subTitle = String(formData.get("subTitle") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const themeRaw = String(formData.get("theme") ?? "").trim();
  const theme = (DaisyThemes as readonly string[]).includes(themeRaw)
    ? (themeRaw as SiteSettings["theme"])
    : undefined;
  const contactEmail =
    String(formData.get("contactEmail") ?? "").trim() || undefined;

  const current = await readSiteSettings();

  // images de settings -> /images/*
  const newDefaultOg = await changeImgSetting({
    formData,
    inputName: "defaultOgFile",
    settingName: "defaultOg",
    defaultFilename: "og-default",
    currentFilePath: current.defaultOg,
  });

  const newHeaderLogo = await changeImgSetting({
    formData,
    inputName: "headerLogoFile",
    settingName: "headerLogo",
    defaultFilename: "header-logo",
    currentFilePath: current.headerLogo || "",
  });

  const newHomeLogo = await changeImgSetting({
    formData,
    inputName: "homeLogoFile",
    settingName: "homeLogo",
    defaultFilename: "home-logo",
    currentFilePath: current.homeLogo || "",
  });

  // favicon: data/favicon.ico (servi via app/favicon.ico/route.ts)
  const fav = formData.get("faviconFile") as File | null;
  if (fav && fav.size > 0) {
    if (fav.size > MAX_FILE_BYTES)
      throw new Error("Fichier trop volumineux (max 8 Mo).");
    await fs.mkdir(dataDir, { recursive: true, mode: 0o755 });
    const buf = Buffer.from(await fav.arrayBuffer());
    await atomicWrite(path.join(dataDir, "favicon.ico"), buf, 0o644);
  }

  await writeSiteSettings({
    ...current,
    tagline,
    contactEmail,
    defaultOg: newDefaultOg || current.defaultOg,
    headerLogo: newHeaderLogo || current.headerLogo,
    homeLogo: newHomeLogo || current.homeLogo,
    favicon: current.favicon, // la route /favicon.ico lit data/favicon.ico directement
    subTitle,
    about,
    theme: theme || current.theme,
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/articles");
}

/** Suppression d’un article */
export async function deleteArticle(formData: FormData) {
  await ensureDirs();

  const slug = sanitizeSlug(String(formData.get("slug") ?? ""));
  if (!slug) return;

  // charge index
  const index = await readIndexSafe();

  // trouve l’article
  const toDelete = index.find((p) => p.slug === slug);
  if (!toDelete) return;

  // supprime HTML + image
  await safeUnlink(path.join(htmlDir, `${slug}.html`));
  if (toDelete.imgPath) {
    const base = path.basename(toDelete.imgPath); // “slug.ext”
    await safeUnlink(path.join(imgDir, base));
  }

  // maj index
  const updated = index.filter((p) => p.slug !== slug);
  await atomicWrite(indexFile, JSON.stringify(updated, null, 2), 0o644);

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
}
