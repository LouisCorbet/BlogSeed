/**
 * Instrumentation Next.js — exécutée une fois au démarrage du serveur.
 *
 * On y synchronise les credentials Google OAuth depuis la BDD vers
 * process.env, pour que la config Next-Auth (chargée de façon synchrone)
 * puisse les lire. Un changement de ces credentials depuis l'admin
 * nécessite un redémarrage du container (mécanisme prévu en phase 8/12).
 */
export async function register() {
  // Uniquement côté serveur Node.js (pas en edge).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncGoogleEnv } = await import("@/lib/auth/providers");
    await syncGoogleEnv();
  }
}
