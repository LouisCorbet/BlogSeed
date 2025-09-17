/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
// ==== AJOUTS UTILES EN HAUT DE FICHIER ====
// import path from "path";                    // probable déjà importé
// import { v4 as uuidv4 } from "uuid";        // déjà importé chez toi
import { updateStatus } from "@/lib/autoPublishStatus";
import {
  AutoPublishSchedule,
  DaisyThemes,
  readSiteSettings,
  writeSiteSettings,
  type SiteSettings,
} from "../../lib/siteSettings.server";

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
  return (
    input
      .toLowerCase()
      // Décompose accents + certaines ligatures (compat) puis retire les diacritiques
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // enlève les marques d’accent
      // Ligatures/symboles courants qui ne sont pas toujours couverts par NFKD selon l’environnement
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/ß/g, "ss")
      // Remplace toute séquence non alphanumérique par un tiret
      .replace(/[^a-z0-9]+/g, "-")
      // Trim des tirets au début/fin + dé-doublonnage
      .replace(/^-+|-+$/g, "")
      .replace(/--+/g, "-")
  );
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

  const title = String(formData.get("title") ?? "").trim();
  // slug
  // const baseSlug = String(formData.get("slug") ?? "");
  const slug =
    oldArticle?.title === title
      ? oldArticle.slug
      : `${sanitizeSlug(title)}-${Date.now()}`;
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

const HORDE_KEY = process.env.HORDE_API_KEY || ""; // facultatif (anonyme = plus lent)
const CLIENT_AGENT = "your-app-name/1.0 (mailto:you@example.com)"; // recommandé par Horde
async function generateWithHorde(
  prompt: string,
  width = 1024,
  height = 1024,
  retries = 40
) {
  const submitRes = await fetch(
    `https://stablehorde.net/api/v2/generate/async`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Client-Agent": CLIENT_AGENT,
        apikey: HORDE_KEY,
      },
      body: JSON.stringify({
        prompt,
        params: {
          width,
          height,
          steps: 28,
          cfg_scale: 6.5,
          sampler_name: "k_euler",
          karras: true,
          // ← le plus important pour éviter le texte
          negative_prompt:
            "text, letters, words, caption, watermark, logo, signature, typography, title, numbers, digits, ui, overlay, meme, frames, borders, jpeg artifacts",
          n: 1,
        },
        // Évite "flux" (le negative n’est pas pris en compte)
        models: ["SDXL"],
        nsfw: false,
      }),
    }
  );

  if (submitRes.status !== 202)
    throw new Error(
      `Horde submit failed: ${submitRes.status} ${await submitRes.text()}`
    );
  const { id } = await submitRes.json();

  for (let i = 0; i < retries; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const statusRes = await fetch(
      `https://stablehorde.net/api/v2/generate/status/${id}`,
      {
        headers: { "Client-Agent": CLIENT_AGENT, apikey: HORDE_KEY },
        cache: "no-store",
      }
    );
    const data = await statusRes.json();
    if (data?.done && data?.generations?.length) {
      const g = data.generations[0];
      if (typeof g.img === "string" && g.img.startsWith("data:")) {
        return Buffer.from(g.img.split(",")[1] || g.img, "base64");
      } else if (typeof g.img === "string") {
        const r = await fetch(g.img);
        if (!r.ok) throw new Error(`Horde CDN fetch failed: ${r.status}`);
        return Buffer.from(await r.arrayBuffer());
      }
    }
  }
  throw new Error("Horde timeout/no image");
}

async function fetchPollinationsImage(prompt: string, w = 1024, h = 1024) {
  // Même prompt visuel + “no text”
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt
  )}?width=${w}&height=${h}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Pollinations failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function saveAsWebp(buffer: Buffer, diskPath: string, quality = 78) {
  const sharp = (await import("sharp")).default;
  sharp.cache(false);
  sharp.concurrency(1); // ou 2
  await sharp(buffer).webp({ quality }).toFile(diskPath);

  // const webp = await sharp(buffer).webp({ quality }).toBuffer();
  // await atomicWrite(diskPath, webp, 0o644);
}

function buildImagePrompt(title: string, catchphrase?: string) {
  return [
    // // Sujet -> éléments visuels, pas de texte
    // `Colorful realistic picture about: ${title}`,
    // `minimalist interior, clean room, center composition, 1:1, clean lighting`,
    // `high contrast, eye-catching, no text, no letters, no logo`,
    // // un style “safe” pour vignettes
    // `vector-like aesthetic, modern editorial hero image, crisp edges`,
    `fais une image type photo réaliste, montrant une personne heureuse dans une pièce bien rangée, relativement au sujet suivant : ${title}`,
  ].join(", ");
}

///////////////////////////////////////////////////////////////////////////////////////////////////

// ---- imports probables en haut du fichier ----
// import path from "path";
// import sharp from "sharp";
// import { v4 as uuidv4 } from "uuid";
// import { revalidatePath } from "next/cache";
// + tes utilitaires: ensureDirs, readIndexSafe, atomicWrite, safeUnlink, sanitizeSlug, imgDir, htmlDir, indexFile, etc.

const HORDE_BASE = "https://stablehorde.net/api/v2";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY!;
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";

async function askMistralForArticle(): Promise<{
  title: string;
  htmlInput: string;
  imageAlt: string;
  catchphrase: string;
  // facultatif si tu veux piloter l'image finement
  imagePrompt?: string;
}> {
  const system = `Tu es un rédacteur web FR. Tu renvoies STRICTEMENT un JSON valide avec les clés:
- "title": titre accrocheur (max ~70 caractères)
- "catchphrase": une courte accroche (max ~120 caractères)
- "htmlInput": contenu HTML propre (paragraphes <p>, listes, sous-titres <h2>… — pas de <html> ni <body>)
- "imagePrompt": une description VISUELLE (sans texte/lettres) pour guider une illustration carrée, sans texte.
- "imageAlt": texte alternatif concis et descriptif pour l'image (sans mots comme "image de")

Exigences:
- Langue: FR
- Sujet: utile, concret, intemporel (conseils pratiques), optimisé SEO
- Ton: clair, concis, pédagogique
- HTML: sémantique simple (<h2>, <p>, <ul>), utilisation de tailwind et daisyUI autant que possible
- PAS de Markdown.`;

  const siteSettings = await readSiteSettings();

  // Tu peux personnaliser ce "brief" pour orienter la thématique générale de l’article du jour
  const user = siteSettings.autoPublishPrompt || "";

  const res = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: siteSettings.autoPublishModel || "mistral-large-latest",
      // Mistral supporte le format "json_object" (équivalent OpenAI)
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      // max_tokens: 2000,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Mistral API error: ${res.status} ${t}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Mistral: empty content");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    // fallback: essaie d’extraire un JSON brut
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Mistral: JSON missing");
    parsed = JSON.parse(match[0]);
  }

  const title = (parsed.title || "").toString().trim();
  const htmlInput = (parsed.htmlInput || "").toString().trim();
  const imageAlt = (parsed.imageAlt || "").toString().trim();
  const catchphrase = (parsed.catchphrase || "").toString().trim();
  const imagePrompt = (parsed.imagePrompt || "").toString().trim();

  if (!title || !htmlInput || !imageAlt || !catchphrase) {
    throw new Error("Mistral JSON missing required keys");
  }
  return { title, htmlInput, imageAlt, catchphrase, imagePrompt };
}

function buildImagePromptFromText({
  title,
  catchphrase,
  imagePrompt,
}: {
  title: string;
  catchphrase?: string;
  imagePrompt?: string;
}) {
  // Priorité au "imagePrompt" fourni par Mistral s'il existe.
  if (imagePrompt && imagePrompt.length > 10) {
    return [
      imagePrompt,
      "square 1:1, minimal, colorful, center composition, clean lighting, vector-like aesthetic, high contrast, no text, no letters, no logo",
    ].join(", ");
  }
  // Sinon, fallback visuel dérivé du titre/accroche
  return [
    `Colorful minimal abstract illustration about: ${title}`,
    catchphrase ? `theme hints: ${catchphrase}` : "",
    "flat shapes, soft gradient background, square 1:1, center composition, crisp edges, high contrast, modern editorial hero, no text, no letters, no logo",
  ]
    .filter(Boolean)
    .join(", ");
}

// ------------------------------ Fonction principale ------------------------------

export async function saveArticleAutoCore() {
  try {
    updateStatus("init", "Préparation des dossiers");
    await ensureDirs();

    updateStatus("load-index", "Lecture de l’index");
    const index = await readIndexSafe();

    updateStatus("ai", "Génération article (Mistral)");
    const { title, htmlInput, imageAlt, catchphrase, imagePrompt } =
      await askMistralForArticle();

    const slug = `${sanitizeSlug(title)}-${Date.now()}`;
    const dateInputRaw = new Date().toISOString();
    const articleId = uuidv4();

    // (2) --- Générer l’image
    updateStatus("image", "Génération image IA");
    const prompt = buildImagePromptFromText({
      title,
      catchphrase,
      imagePrompt,
    });

    const fileName = `${slug}.webp`;
    const diskPath = path.join(imgDir, fileName);
    const thumbName = `${slug}-512.webp`;
    const thumbPath = path.join(imgDir, thumbName);

    const sharp = (await import("sharp")).default;
    sharp.cache(false);
    sharp.concurrency(1);

    const tryGen = async (): Promise<Buffer | null> => {
      try {
        return await generateWithHorde(prompt, 512, 512);
      } catch (e: any) {
        console.warn("[saveArticleAuto] Horde indisponible:", e?.message);
      }
      try {
        return await fetchPollinationsImage(prompt, 512, 512);
      } catch (e: any) {
        console.warn(
          "[saveArticleAuto] Pollinations indisponible:",
          e?.message
        );
      }
      return null;
    };

    let buf = await tryGen();

    if (buf) {
      updateStatus("image", "Écriture image principale + thumb");
      await sharp(buf).webp({ quality: 78 }).toFile(diskPath);
      await sharp(diskPath)
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 76 })
        .toFile(thumbPath);
      // libère mémoire
      buf = null;
    } else {
      updateStatus("image-fallback", "Écriture placeholder");
      await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 3,
          background: { r: 234, g: 234, b: 234 },
        },
      })
        .webp({ quality: 78 })
        .toFile(diskPath);
      await sharp(diskPath)
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 76 })
        .toFile(thumbPath);
    }

    // (3) --- HTML
    updateStatus("html", "Écriture du HTML");
    const htmlPath = path.join(htmlDir, `${slug}.html`);
    await atomicWrite(htmlPath, htmlInput, 0o644);

    // (4) --- Index
    updateStatus("index", "Mise à jour de l’index");
    const siteSettings = await readSiteSettings();
    const updated: PostIndexEntry = {
      id: articleId,
      slug,
      title,
      author: siteSettings.autoPublishAuthor || "Rédaction auto",
      date: dateInputRaw,
      imgPath: `/images/${fileName}`,
      imageAlt,
      catchphrase,
    };

    const rest = index.filter((p) => p.id !== articleId);
    rest.push(updated);
    await atomicWrite(indexFile, JSON.stringify(rest, null, 2), 0o644);

    // (5) --- Revalidate
    // updateStatus("revalidate", "Revalidation ISR");
    // try {
    //   revalidatePath("/", "layout");
    //   revalidatePath("/");
    //   revalidatePath("/articles");
    //   revalidatePath(`/articles/${slug}`);
    // } catch (e: any) {
    //   console.warn("[saveArticleAuto] revalidatePath ignorée:", e?.message);
    // }

    updateStatus("done", `Article ${slug} publié`);
    return {
      ok: true,
      slug,
      revalidatePaths: ["/", "/articles", `/articles/${slug}`],
      revalidateLayout: true,
    };
  } catch (fatal: any) {
    updateStatus("error", fatal?.message || "Erreur inconnue");
    console.error("[saveArticleAutoCore] ERREUR FATALE:", fatal?.message);
    return { ok: false, error: fatal?.message || "unknown_error" };
  }
}

export async function saveArticleAuto() {
  const res = await saveArticleAutoCore();
  if (res?.ok) {
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/articles");
      revalidatePath(`/articles/${res.slug}`);
    } catch (err) {
      console.warn("[saveArticleAuto] revalidatePath failed:", err);
    }
  }
  return res;
}

function parseDayTimes(s: FormDataEntryValue | null): string[] {
  if (!s) return [];
  const raw = String(s).trim();
  if (!raw) return [];
  // "08:00, 14:30 ; 19:05" -> ["08:00","14:30","19:05"], filtrées/validées HH:mm
  return raw
    .split(/[;,]/g)
    .map((x) => x.trim())
    .filter((x) => /^[0-2]\d:[0-5]\d$/.test(x))
    .map((x) => {
      // normalisation 24h strict (00-23:00-59)
      const [hh, mm] = x.split(":").map(Number);
      const H = Math.min(Math.max(hh, 0), 23);
      const M = Math.min(Math.max(mm, 0), 59);
      return `${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`;
    });
}

export async function saveAutoPublishSettings(formData: FormData) {
  const current = await readSiteSettings();

  const sched: AutoPublishSchedule = {
    monday: parseDayTimes(formData.get("times_monday")),
    tuesday: parseDayTimes(formData.get("times_tuesday")),
    wednesday: parseDayTimes(formData.get("times_wednesday")),
    thursday: parseDayTimes(formData.get("times_thursday")),
    friday: parseDayTimes(formData.get("times_friday")),
    saturday: parseDayTimes(formData.get("times_saturday")),
    sunday: parseDayTimes(formData.get("times_sunday")),
  };

  const next = {
    ...current,
    autoPublishEnabled: !formData.get("autoPublishEnabled")
      ? current.autoPublishEnabled
      : formData.get("autoPublishEnabled") === "on",
    autoPublishPrompt: String(formData.get("autoPublishPrompt") || ""),
    autoPublishModel: String(
      formData.get("autoPublishModel") || "mistral-large-latest"
    ),
    autoPublishAuthor: String(
      formData.get("autoPublishAuthor") || "Rédaction auto"
    ),
    autoPublishSchedule: sched,
  };

  await writeSiteSettings(next);
  revalidatePath("/admin");
}
export async function publishAutoNow() {
  const res = await saveArticleAutoCore();
  if (res?.ok) {
    try {
      if (res.revalidateLayout) revalidatePath("/", "layout");
      for (const p of res.revalidatePaths || []) revalidatePath(p);
    } catch (e) {
      console.warn(
        "[publishAutoNow] revalidate ignorée:",
        (e as Error).message
      );
    }
  }
  // return res;
}
export async function toggleAutoPublishDirect(enabled: boolean) {
  const current = await readSiteSettings();
  await writeSiteSettings({
    ...current,
    autoPublishEnabled: !!enabled,
  });
  revalidatePath("/admin");
}
