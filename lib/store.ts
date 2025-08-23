import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data");

const IMG_PATH = path.join(DATA_PATH, "img");

const ARTICLES_PATH = path.join(DATA_PATH, "articles");
const ARTICLES_HTML_PATH = path.join(ARTICLES_PATH, "html");
const ARTICLES_INDEX_PATH = path.join(ARTICLES_PATH, "index.json");

export type Article = {
  slug: string;
  title: string;
  author: string;
  date: string; // ISO string
  path: string; // "articles/<slug>.html"
  imgPath: string; // "articles/<slug>.jpg"
};

export async function readIndex(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(ARTICLES_INDEX_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeIndex(items: Article[]) {
  await fs.mkdir(DATA_PATH, { recursive: true });
  await fs.writeFile(
    ARTICLES_INDEX_PATH,
    JSON.stringify(items, null, 2),
    "utf8"
  );
}

export async function getHTML(slug: string) {
  try {
    return await fs.readFile(
      path.join(ARTICLES_HTML_PATH, `${slug}.html`),
      "utf8"
    );
  } catch (err) {
    // console.error("Erreur lors de la lecture du fichier HTML :", err);
    return null;
  }
}

export async function upsert({
  slug,
  title,
  author,
  htmlContent,
  date,
}: {
  slug: string;
  title: string;
  author: string;
  htmlContent: string;
  date?: string;
}) {
  await fs.mkdir(ARTICLES_HTML_PATH, { recursive: true });
  await fs.writeFile(
    path.join(ARTICLES_HTML_PATH, `${slug}.html`),
    htmlContent,
    "utf8"
  );

  const items = await readIndex();
  const idx = items.findIndex((a) => a.slug === slug);
  const item: Article = {
    slug,
    title,
    author,
    date: date || new Date().toISOString(),
    path: `articles/${slug}.html`,
    imgPath: `images/${slug}.jpg`,
  };
  if (idx === -1) items.push(item);
  else items[idx] = item;
  await writeIndex(items);
  return item;
}

export async function remove(slug: string) {
  try {
    await fs.rm(path.join(ARTICLES_HTML_PATH, `${slug}.html`));
  } catch {}
  const items = await readIndex();
  await writeIndex(items.filter((a) => a.slug !== slug));
}
