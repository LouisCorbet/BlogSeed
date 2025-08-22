import Link from "next/link";
import { readIndex } from "@/lib/store";

export default async function Home() {
  const all = await readIndex();
  const latest = [...all]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Mon Blog</h1>
      <p className="text-gray-600 mb-6">Derniers articles</p>
      <ul className="space-y-2">
        {latest.map((a) => (
          <li key={a.slug}>
            <Link
              className="text-blue-600 underline"
              href={`/articles/${a.slug}`}
            >
              {a.title}{" "}
              <span className="text-sm text-gray-500">
                — {new Date(a.date).toLocaleDateString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link href="/articles" className="text-blue-600 underline">
          Voir tous les articles →
        </Link>
        <hr></hr>
        <Link href="/admin" className="text-blue-600 underline">
          Administration
        </Link>
      </div>
    </main>
  );
}
