"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4, v4 } from "uuid";

import {
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

// Optionnel : limite de 8 Mo
const MAX_FILE_BYTES = 8 * 1024 * 1024;

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
  // let defaultOg = String(formData.get("defaultOg") ?? "").trim();
  const file = formData.get(inputName) as File | null;
  let fname = "";

  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Fichier trop volumineux (max 8 Mo).");
    }
    const settings: SiteSettings = await readSiteSettings();
    if (
      typeof (settings as Record<string, unknown>)[settingName] === "string"
    ) {
      const oldImgPath = path.join(
        process.cwd(),
        "public",
        (settings as Record<string, unknown>)[settingName] as string
      );
      console.log("Deleting old image:", oldImgPath);
      await safeUnlink(oldImgPath);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    fname = `${defaultFilename}.${ext}`;
    const dir = path.join(process.cwd(), "public");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, fname), buf);
    return `/${fname}`;
  }
  return currentFilePath;
}

export async function saveSiteSettings(formData: FormData) {
  const tagline = String(formData.get("tagline") ?? "").trim();
  const subTitle = String(formData.get("subTitle") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  // const twitter = String(formData.get("twitter") ?? "").trim() || undefined;
  const contactEmail =
    String(formData.get("contactEmail") ?? "").trim() || undefined;

  // // Image OG (upload optionnel)
  // let defaultOg = String(formData.get("defaultOg") ?? "").trim();
  // console.log("formData:", formData);
  // const file = formData.get("defaultOgFile") as File | null;

  // if (file && file.size > 0) {
  //   if (file.size > MAX_FILE_BYTES) {
  //     throw new Error("Fichier trop volumineux (max 8 Mo).");
  //   }

  //   //delete old image
  //   //get current settings
  //   const settings = await readSiteSettings();
  //   if (settings.defaultOg) {
  //     const oldImgPath = path.join(process.cwd(), "public", settings.defaultOg);
  //     console.log("Deleting old image:", oldImgPath);
  //     await safeUnlink(oldImgPath);
  //   }

  //   const arrayBuffer = await file.arrayBuffer();
  //   const buf = Buffer.from(arrayBuffer);
  //   const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  //   const fname = `og-default.${ext}`;
  //   const dir = path.join(process.cwd(), "public");
  //   await fs.mkdir(dir, { recursive: true });
  //   await fs.writeFile(path.join(dir, fname), buf);
  //   defaultOg = `/${fname}`;
  // }

  //get current sitesettings
  const current = await readSiteSettings();

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
  //update favicon
  const newFavicon = await changeImgSetting({
    formData,
    inputName: "faviconFile",
    settingName: "favicon",
    defaultFilename: "favicon",
    currentFilePath: current.favicon || "",
  });

  const file = formData.get("faviconFile") as File | null;
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Fichier trop volumineux (max 8 Mo).");
    }
    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const dir = path.join(process.cwd(), "public");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "favicon.ico"), buf);
  }

  await writeSiteSettings({
    ...current,
    tagline,
    // twitter,
    contactEmail,
    defaultOg: newDefaultOg || current.defaultOg,
    headerLogo: newHeaderLogo || current.headerLogo,
    homeLogo: newHomeLogo || current.homeLogo,
    favicon: newFavicon || current.favicon,
    subTitle,
    about,
  });

  // Revalidation : home + layout (au besoin)/ pages d'articles (metas)
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/articles");
}
