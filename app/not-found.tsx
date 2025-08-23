// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-base-200 px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <span className="text-3xl">🧭</span>
        </div>

        <h1 className="text-4xl font-bold mb-2">Page introuvable</h1>
        <p className="text-base-content/70 mb-6">
          Oups… La page que vous cherchez n’existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn btn-primary">
            ← Retour à l’accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
