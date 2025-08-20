import Link from "next/link";
import { readIndex } from "@/lib/store";

export default async function Articles() {
  const items = await readIndex();
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Tous les articles</h1>
      <ul className="space-y-2">
        {sorted.map((a) => (
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
    </main>
  );
}
