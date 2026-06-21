/**
 * Page d'accueil — placeholder de la phase 1.
 * La vraie landing page "style Netflix" est construite en phase 3.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold">Plateforme Blog</h1>
      <p className="text-lg opacity-70">
        Phase 1 opérationnelle — structure, base de données et infrastructure
        Docker en place.
      </p>
      <p className="text-sm opacity-50">
        Les pages publiques et l&apos;administration arrivent dans les phases
        suivantes.
      </p>
    </main>
  );
}
