/**
 * URL de base publique du site.
 *
 * Source unique : NEXTAUTH_URL (déjà obligatoire dans .env, cohérent avec
 * la contrainte « 3 variables max »). Sert pour les liens absolus :
 * canonical, og:url, sitemap.xml, rss.xml, redirections /go/.
 *
 * On retire un éventuel slash final pour pouvoir concaténer proprement.
 */
export function getBaseUrl(): string {
  const raw = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * Construit une URL absolue à partir d'un chemin relatif.
 * absoluteUrl("/article/mon-slug") -> "https://exemple.fr/article/mon-slug"
 */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
