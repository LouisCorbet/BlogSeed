/* eslint-disable @typescript-eslint/no-explicit-any */
// instrumentation.node.ts
"use server";
import "server-only";
export const runtime = "nodejs";

const TZ = "Europe/Paris";
const MINUTE_MS = 60_000;
const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
type DayKey = (typeof DAY_KEYS)[number];

function fmtHHmm(date: Date) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}
function getDayKey(date: Date): DayKey {
  const local = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  return DAY_KEYS[local.getDay()];
}
function normalizeTimes(times?: string[]) {
  if (!times?.length) return [];
  return times.map((t) => {
    const [H, M = "00"] = t.split(":");
    return `${String(parseInt(H, 10)).padStart(2, "0")}:${String(
      parseInt(M, 10)
    ).padStart(2, "0")}`;
  });
}

export async function register() {
  const g = globalThis as any;
  if (g.__CRON_STARTED_MINUTELY__) return;
  g.__CRON_STARTED_MINUTELY__ = true;

  const ranSet = new Set<string>(); // anti-doublon minute
  const now = new Date();
  const msToNextMinute = MINUTE_MS - (now.getTime() % MINUTE_MS);

  setTimeout(() => {
    tick();
    setInterval(tick, MINUTE_MS);
  }, msToNextMinute);

  async function tick() {
    try {
      // Imports dynamiques pour éviter que l’edge bundle les voie
      const { readSiteSettings } = await import("./lib/siteSettings.server");
      const settings = await readSiteSettings();
      if (!settings.autoPublishEnabled) {
        return;
      }

      const d = new Date();
      const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
      const key = local.toISOString().slice(0, 16).replace("T", " "); // "YYYY-MM-DD HH:MM"
      if (ranSet.has(key)) return;
      if (ranSet.size > 2000) ranSet.clear();

      const hhmm = fmtHHmm(local);
      const dayKey = getDayKey(local);
      const slots = normalizeTimes(settings.autoPublishSchedule?.[dayKey]);

      if (!slots.includes(hhmm)) {
        return;
      }
      console.log(`[auto-publish] running for ${dayKey} ${hhmm}`);

      ranSet.add(key);
      const { saveArticleAuto } = await import("./app/admin/actions"); // Node runtime (sharp, fs)
      console.log("[auto-publish] saveArticleAuto...");
      await saveArticleAuto();
      console.log("[auto-publish] done.");
    } catch (err) {
      console.error("[auto-publish] tick error:", err);
    }
  }
}
