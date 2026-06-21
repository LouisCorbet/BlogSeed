import DOMPurify from "isomorphic-dompurify";

/**
 * Utilitaires de traitement du contenu d'article (HTML produit par TipTap
 * ou saisi en HTML brut).
 *
 * - sanitizeHtml : nettoyage XSS côté serveur (obligatoire, le contenu peut
 *   provenir d'un éditeur HTML brut).
 * - estimateReadingTime : minutes de lecture (~200 mots/min).
 * - extractHeadings : table des matières depuis les H2/H3.
 * - addHeadingIds : injecte des id sur les H2/H3 pour l'ancrage de la TOC.
 */

const ALLOWED_TAGS = [
  "p", "br", "hr", "blockquote", "pre", "code",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "strong", "b", "em", "i", "u", "s", "mark", "sub", "sup",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "span", "div",
];

const ALLOWED_ATTR = [
  "href", "target", "rel",
  "src", "alt", "title", "width", "height", "loading",
  "class", "id", "colspan", "rowspan", "start",
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Les liens externes ouverts dans un nouvel onglet seront sécurisés
    // (rel) à l'affichage ; on autorise target ici.
    ADD_ATTR: ["target"],
  });
}

/**
 * Estime le temps de lecture en minutes (arrondi au supérieur, min. 1).
 */
export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Convertit un texte en slug d'ancre (pour les id de titres).
 */
export function slugifyAnchor(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extrait les titres H2/H3 du contenu pour construire la table des matières.
 * Les id générés sont identiques à ceux injectés par addHeadingIds (mêmes
 * règles + même déduplication), garantissant que les ancres fonctionnent.
 */
export function extractHeadings(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const seen = new Map<string, number>();
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3;
    const text = match[2].replace(/<[^>]*>/g, "").trim();
    if (!text) continue;

    let id = slugifyAnchor(text) || "section";
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Injecte des id (mêmes règles que extractHeadings) sur les H2/H3 du contenu,
 * pour que les liens de la table des matières pointent vers la bonne ancre.
 * On préserve un id déjà présent dans la balise.
 */
export function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();

  return html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (full, levelStr, attrs, inner) => {
      // Conserver un id existant
      if (/\sid\s*=/.test(attrs)) return full;

      const text = inner.replace(/<[^>]*>/g, "").trim();
      if (!text) return full;

      let id = slugifyAnchor(text) || "section";
      const count = seen.get(id) ?? 0;
      seen.set(id, count + 1);
      if (count > 0) id = `${id}-${count}`;

      return `<h${levelStr}${attrs} id="${id}">${inner}</h${levelStr}>`;
    },
  );
}
