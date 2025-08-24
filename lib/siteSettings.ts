// lib/siteSettings.ts
import { promises as fs } from "fs";
import path from "path";

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
};

const DEFAULT_SETTINGS: SiteSettings = {
  tagline: "Guides, articles et inspirations. Léger, rapide et SEO-friendly.",
  // twitter: "",
  contactEmail: "",
  defaultOg: "/og-default.jpg",
  name: process.env.SITE_NAME || "",
  url: process.env.SITE_URL || "", // domaine absolu (sans slash final)
  localeDefault: process.env.SITE_LOCALE_DEFAULT || "fr_FR",
  titleTemplate: `%s — ${process.env.SITE_NAME}`,
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "site.json");

export async function readSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    // si le fichier n'existe pas encore
    return DEFAULT_SETTINGS;
  }
}

export async function writeSiteSettings(next: SiteSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = FILE_PATH + ".tmp";

  // validation très légère (garde simple)
  if (!next.name?.trim()) throw new Error("Le nom du site est requis.");
  if (!next.url?.startsWith("http")) throw new Error("URL du site invalide.");
  console.log(next.defaultOg);
  if (!next.defaultOg?.startsWith("/"))
    throw new Error("defaultOg doit commencer par /");

  await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
  await fs.rename(tmp, FILE_PATH);
}
