import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "data");
const INDEX = path.join(ROOT, "index.json");
const DIR = path.join(ROOT, "articles");

export type Article = {
  slug: string;
  title: string;
  author: string;
  date: string; // ISO string
  path: string; // "articles/<slug>.html"
};

export async function readIndex(): Promise<Article[]> {
  try {
    const raw = await fs.readFile(INDEX, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeIndex(items: Article[]) {
  await fs.mkdir(ROOT, { recursive: true });
  await fs.writeFile(INDEX, JSON.stringify(items, null, 2), "utf8");
}

export async function getHTML(slug: string) {
  try {
    return await fs.readFile(path.join(DIR, `${slug}.html`), "utf8");
  } catch {
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
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${slug}.html`), htmlContent, "utf8");

  const items = await readIndex();
  const idx = items.findIndex((a) => a.slug === slug);
  const item: Article = {
    slug,
    title,
    author,
    date: date || new Date().toISOString(),
    path: `articles/${slug}.html`,
  };
  if (idx === -1) items.push(item);
  else items[idx] = item;
  await writeIndex(items);
  return item;
}

export async function remove(slug: string) {
  try {
    await fs.rm(path.join(DIR, `${slug}.html`));
  } catch {}
  const items = await readIndex();
  await writeIndex(items.filter((a) => a.slug !== slug));
}
