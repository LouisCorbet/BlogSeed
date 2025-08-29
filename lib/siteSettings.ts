// lib/siteSettings.ts
import { promises as fs } from "fs";
import path from "path";
import "../envConfig";

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
export type SiteSettings = {
  name: string;
  url: string; // absolu (https://…)
  tagline: string;
  // twitter?: string; // @handle ou URL
  contactEmail?: string; // public
  defaultOg: string;
  localeDefault: string;
  titleTemplate: string;
  headerLogo?: string; // relatif (ex: /logo.png)
  homeLogo?: string; // relatif (ex: /logo.png)
  favicon?: string; // relatif (ex: /favicon.ico)
  about?: string; // description plus longue, optionnelle
  subTitle?: string; // sous-titre, optionnel
  theme: DaisyTheme; // thème, optionnel
};

function getDefaultSettings(): SiteSettings {
  return {
    tagline: "Guides, articles et inspirations. Léger, rapide et SEO-friendly.",
    contactEmail: "",
    defaultOg: "/og-default.png",
    name: process.env.SITE_NAME || "BloggSeed",
    url: process.env.SITE_URL || "https://blogseed.com",
    localeDefault: process.env.SITE_LOCALE_DEFAULT || "fr_FR",
    titleTemplate: `%s — ${process.env.SITE_NAME || "BlogSeed"}`,
    theme: DaisyThemes[0],
    headerLogo: "/header-logo.png",
    homeLogo: "/home-logo.png",
    favicon: "/favicon.ico",
    about: "",
    subTitle: "",
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "site.json");

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { ...getDefaultSettings(), ...parsed };
  } catch {
    console.log("Erreur lors de la lecture des paramètres du site");
    // si le fichier n'existe pas encore
    return getDefaultSettings();
  }
}

export async function writeSiteSettings(next: SiteSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = FILE_PATH + ".tmp";

  // validation très légère (garde simple)
  if (!next.name?.trim()) throw new Error("Le nom du site est requis.");
  if (!next.url?.startsWith("http")) throw new Error("URL du site invalide.");
  if (!next.defaultOg?.startsWith("/"))
    throw new Error("defaultOg doit commencer par /");

  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, FILE_PATH);
}
