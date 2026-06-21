import { getSettings, SETTING_KEYS } from "@/lib/settings";

/**
 * Helpers liés à la configuration des providers OAuth pilotée depuis la BDD.
 *
 * Contrainte : NextAuth() lit ses providers de façon synchrone au chargement
 * du module. On ne peut donc pas y faire un await sur la BDD. La solution :
 * au démarrage du serveur (instrumentation), on lit les credentials Google
 * en base et on les copie dans process.env (AUTH_GOOGLE_ID / SECRET), que
 * le module auth lit ensuite de façon synchrone.
 *
 * Toute modification des credentials Google depuis l'admin nécessite donc
 * un redémarrage du container (mécanisme Socket Proxy, phase 8/12).
 */

/**
 * Copie les credentials Google de la BDD vers process.env si Google est
 * activé. Appelé une fois au démarrage (voir src/instrumentation.ts).
 */
export async function syncGoogleEnv(): Promise<void> {
  try {
    const settings = await getSettings([
      SETTING_KEYS.GOOGLE_OAUTH_ENABLED,
      SETTING_KEYS.GOOGLE_CLIENT_ID,
      SETTING_KEYS.GOOGLE_CLIENT_SECRET,
    ]);

    const enabled = settings[SETTING_KEYS.GOOGLE_OAUTH_ENABLED] === "true";
    const id = settings[SETTING_KEYS.GOOGLE_CLIENT_ID];
    const secret = settings[SETTING_KEYS.GOOGLE_CLIENT_SECRET];

    if (enabled && id && secret) {
      process.env.AUTH_GOOGLE_ID = id;
      process.env.AUTH_GOOGLE_SECRET = secret;
    } else {
      delete process.env.AUTH_GOOGLE_ID;
      delete process.env.AUTH_GOOGLE_SECRET;
    }
  } catch (error) {
    console.error("[auth] Synchronisation Google impossible :", error);
  }
}

/**
 * Indique si Google OAuth est actif (pour l'affichage conditionnel du
 * bouton sur les pages login/register). Lecture BDD directe.
 */
export async function isGoogleEnabled(): Promise<boolean> {
  const settings = await getSettings([
    SETTING_KEYS.GOOGLE_OAUTH_ENABLED,
    SETTING_KEYS.GOOGLE_CLIENT_ID,
    SETTING_KEYS.GOOGLE_CLIENT_SECRET,
  ]);
  return (
    settings[SETTING_KEYS.GOOGLE_OAUTH_ENABLED] === "true" &&
    !!settings[SETTING_KEYS.GOOGLE_CLIENT_ID] &&
    !!settings[SETTING_KEYS.GOOGLE_CLIENT_SECRET]
  );
}
