/* eslint-disable @typescript-eslint/no-explicit-any */
// instrumentation.ts (à la racine du repo)
import { saveArticleAuto } from "./app/admin/actions";
import { readSiteSettings, type SiteSettings } from "./lib/siteSettings";

// ⏱️ fréquence de check (en ms) — 20s est un bon compromis
const TICK_MS = 20_000;
// Fuseau horaire cible (tu peux le rendre configurable si besoin)
const TZ = "Europe/Paris";

// map JS -> clés de ton schéma
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

function getParisNow() {
  return new Date(); // on formate en TZ via Intl juste après
}

function fmtHHmm(date: Date) {
  // "08:05" en Europe/Paris (24h)
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  });
}

function getDayKey(date: Date): DayKey {
  const idx = parseInt(
    date.toLocaleDateString("en-GB", {
      weekday: "0" as any,
      timeZone: TZ,
    }) as unknown as string,
    10
  );
  // le hack ci-dessus n'est pas portable partout; on va plutôt utiliser getUTCDay()+offset si besoin.
  // -> plus simple: utilise getDay() mais on ne change pas le jour par TZ.
  // Pour rester robuste au TZ, on reconstruit une date locale Paris:
  const d = new Date(date.toLocaleString("en-US", { timeZone: TZ }));
  const dayIdx = d.getDay(); // 0..6, Sunday..Saturday en TZ cible
  return DAY_KEYS[dayIdx];
}

// Anti-doublon par "jour+heure:minute"
function makeRunKey(d: Date) {
  const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const hm = fmtHHmm(local); // HH:MM
  return `${y}-${m}-${day} ${hm}`;
}

function timeMatches(nowHHmm: string, targets?: string[]) {
  if (!targets || targets.length === 0) return false;
  // On normalise les cibles "H:MM" -> "HH:MM"
  const normalized = targets.map((t) => {
    const [H, M = "00"] = t.split(":");
    return `${String(parseInt(H, 10)).padStart(2, "0")}:${String(
      parseInt(M, 10)
    ).padStart(2, "0")}`;
  });
  return normalized.includes(nowHHmm);
}

async function shouldRun(
  settings: SiteSettings,
  now: Date,
  ranSet: Set<string>
) {
  if (!settings.autoPublishEnabled) return false;

  const dayKey = getDayKey(now);
  const hhmm = fmtHHmm(now);
  const slots = settings.autoPublishSchedule?.[dayKey] ?? [];

  if (!timeMatches(hhmm, slots)) return false;

  // anti-double exécution sur ce créneau
  const key = makeRunKey(now);
  if (ranSet.has(key)) return false;

  ranSet.add(key);
  // garde la taille raisonnable
  if (ranSet.size > 5000) {
    const first = ranSet.values().next().value;
    if (first) ranSet.delete(first);
  }
  return true;
}

export async function register() {
  // Ne rien faire côté Edge/middleware
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Évite de démarrer plusieurs fois (HMR/dev ou multiple imports)
  const g = globalThis as any;
  if (g.__CRON_STARTED__) return;
  g.__CRON_STARTED__ = true;

  // Mémoire des runs (anti-doublons HH:MM)
  const ranSet = new Set<string>();

  // Premier tick aligné sur la prochaine dizaine de secondes (optionnel)
  const startNow = getParisNow();
  const msToNextTick = TICK_MS - (startNow.getTime() % TICK_MS);
  setTimeout(loop, msToNextTick);

  async function loop() {
    try {
      const now = getParisNow();
      const settings = await readSiteSettings();

      if (await shouldRun(settings, now, ranSet)) {
        await saveArticleAuto();
      }
    } catch (err) {
      console.error("[auto-publish] loop error:", err);
    } finally {
      setTimeout(loop, TICK_MS);
    }
  }
}
