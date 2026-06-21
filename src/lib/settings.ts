import { prisma } from "@/lib/prisma";

/**
 * Accès centralisé à la configuration globale stockée en BDD (table Setting).
 * Stocke : Google OAuth, SMTP, Analytics, AdSense, RGPD, thème,
 * sections landing, gamification on/off, etc.
 *
 * Toutes les valeurs sont stockées en string ; les helpers typés
 * (getBool, getInt, getJSON) facilitent la lecture.
 */

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await prisma.$transaction(
    Object.entries(entries).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );
}

// ----- Helpers typés -----

export async function getBoolSetting(key: string, fallback = false): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  return v === "true" || v === "1";
}

export async function getIntSetting(key: string, fallback = 0): Promise<number> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

export async function getJSONSetting<T>(key: string, fallback: T): Promise<T> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

/**
 * Clés de settings connues — centralise les noms pour éviter les fautes
 * de frappe à travers le projet.
 */
export const SETTING_KEYS = {
  // Identité du blog
  BLOG_TITLE: "blog.title",
  BLOG_DESCRIPTION: "blog.description",
  BLOG_SOCIAL_LINKS: "blog.socialLinks", // JSON

  // Google OAuth (redémarrage requis à la modification)
  GOOGLE_CLIENT_ID: "auth.googleClientId",
  GOOGLE_CLIENT_SECRET: "auth.googleClientSecret",
  GOOGLE_OAUTH_ENABLED: "auth.googleEnabled",

  // SMTP
  SMTP_HOST: "smtp.host",
  SMTP_PORT: "smtp.port",
  SMTP_USER: "smtp.user",
  SMTP_PASSWORD: "smtp.password",
  SMTP_FROM: "smtp.from",

  // Analytics
  GA_ENABLED: "analytics.gaEnabled",
  GA_TAG_ID: "analytics.gaTagId",
  PLAUSIBLE_ENABLED: "analytics.plausibleEnabled",
  PLAUSIBLE_DOMAIN: "analytics.plausibleDomain",

  // AdSense (JSON par emplacement)
  ADSENSE_CONFIG: "adsense.config",

  // RGPD
  COOKIE_BANNER_ENABLED: "gdpr.bannerEnabled",
  COOKIE_BANNER_TEXT: "gdpr.bannerText",

  // Thème
  THEME_CONFIG: "theme.config", // JSON (couleurs, radius, police, mode sombre)
  FAVICON: "theme.favicon",

  // Landing
  LANDING_SECTIONS: "landing.sections", // JSON

  // Gamification
  GAMIFICATION_ENABLED: "gamification.enabled",
  GAMIFICATION_POINTS: "gamification.points", // JSON (points par action)

  // 404
  NOT_FOUND_CONTENT: "page.notFoundContent",

  // RSS
  RSS_ITEM_COUNT: "rss.itemCount",
} as const;
