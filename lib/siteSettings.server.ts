// lib/siteSettings.server.ts
import "server-only";
export const runtime = "nodejs";

import { unstable_noStore as noStore } from "next/cache";

/**
 * IMPORTANT :
 * - Aucun import 'fs' / 'path' en top-level (Edge scanne ce fichier via l'instrumentation).
 * - On charge fs/path UNIQUEMENT à l'intérieur des fonctions, via eval(import(...)),
 *   pour empêcher l'analyse statique du bundler Edge.
 */
async function nodeDeps() {
  const fsMod: any = await (0, eval)('import("fs")');
  const pathMod: any = await (0, eval)('import("path")');
  const fs = fsMod.promises;
  const path = pathMod.default || pathMod;
  return { fs, path };
}

// ========================= Constantes & Types (safe client) =========================
export const DaisyThemes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "caramellatte",
  "abyss",
  "silk",
] as const;
export type DaisyTheme = (typeof DaisyThemes)[number];

export type AutoPublishSchedule = {
  monday?: string[];
  tuesday?: string[];
  wednesday?: string[];
  thursday?: string[];
  friday?: string[];
  saturday?: string[];
  sunday?: string[];
};

export type SiteSettings = {
  name: string;
  url: string; // absolu (https://…)
  tagline: string;
  contactEmail?: string;
  defaultOg: string;
  localeDefault: string;
  titleTemplate: string;
  headerLogo?: string;
  homeLogo?: string;
  favicon?: string;
  about?: string;
  subTitle?: string;
  theme: DaisyTheme;

  autoPublishEnabled?: boolean; // on/off
  autoPublishPrompt?: string; // prompt IA
  autoPublishModel?: string; // modèle mistral
  autoPublishAuthor?: string; // auteur par défaut
  autoPublishSchedule?: AutoPublishSchedule; // planning par jour
};

// ========================= Defaults =========================
function getDefaultSettings(): SiteSettings {
  return {
    tagline: "Guides, articles et inspirations. Léger, rapide et SEO-friendly.",
    contactEmail: "",
    defaultOg: "/og-default.png",
    name: process.env.SITE_NAME || "Nope",
    url: process.env.SITE_URL || "https://blogseed.com",
    localeDefault: process.env.SITE_LOCALE_DEFAULT || "fr_FR",
    titleTemplate: `%s — ${process.env.SITE_NAME || "Nope"}`,
    theme: DaisyThemes[0],
    headerLogo: "/images/header-logo.png",
    homeLogo: "/images/home-logo.png",
    favicon: "/favicon.ico",
    about: "",
    subTitle: "",
    autoPublishEnabled: false,
    autoPublishPrompt:
      "Écris un article utile et intemporel sur le sujet de ton choix...",
    autoPublishModel: "mistral-large-latest",
    autoPublishAuthor: "Rédaction auto",
    autoPublishSchedule: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  };
}

// ========================= IO (Edge-safe via imports dynamiques) =========================
export async function readSiteSettings(): Promise<SiteSettings> {
  noStore();
  const { fs, path } = await nodeDeps();
  const DATA_DIR = path.join(process.cwd(), "data");
  const FILE_PATH = path.join(DATA_DIR, "site.json");

  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { ...getDefaultSettings(), ...parsed };
  } catch {
    // fichier manquant ou illisible → defaults
    return getDefaultSettings();
  }
}

export async function writeSiteSettings(next: SiteSettings): Promise<void> {
  const { fs, path } = await nodeDeps();
  const DATA_DIR = path.join(process.cwd(), "data");
  const FILE_PATH = path.join(DATA_DIR, "site.json");
  const TMP = FILE_PATH + ".tmp";

  // validation très légère
  if (!next.name?.trim()) throw new Error("Le nom du site est requis.");
  if (!next.url?.startsWith("http")) throw new Error("URL du site invalide.");
  if (!next.defaultOg?.startsWith("/"))
    throw new Error("defaultOg doit commencer par /");

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TMP, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(TMP, FILE_PATH);
}
