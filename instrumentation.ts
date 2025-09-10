/* eslint-disable @typescript-eslint/no-explicit-any */
// instrumentation.ts (à la racine du repo)
import { twiceDailyJob } from "./lib/jobs";

export async function register() {
  // Ne rien faire côté Edge/middleware
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Évite de démarrer plusieurs fois (HMR/dev ou multiple imports)
  const g = globalThis as any;
  if (g.__CRON_STARTED__) return;
  g.__CRON_STARTED__ = true;

  // Lancer tout de suite puis toutes les 12h
  twiceDailyJob().catch(console.error);
  const TWELVE_HOURS = 5000;
  setInterval(() => {
    twiceDailyJob().catch(console.error);
  }, TWELVE_HOURS);
}
