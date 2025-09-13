// instrumentation.ts (à la racine du repo)
import { saveArticleAuto } from "./app/admin/actions";

// export async function register() {
//   // Ne rien faire côté Edge/middleware
//   if (process.env.NEXT_RUNTIME !== "nodejs") return;

//   // Évite de démarrer plusieurs fois (HMR/dev ou multiple imports)
//   const g = globalThis as any;
//   if (g.__CRON_STARTED__) return;
//   g.__CRON_STARTED__ = true;

//   const TWELVE_HOURS = 12 * 60 * 60 * 1000;

//   setInterval(() => {
//     saveArticleAuto().catch(console.error);
//   }, TWELVE_HOURS);
// }
