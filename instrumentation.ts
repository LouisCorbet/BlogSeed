// // instrumentation.ts (RACINE)
// "use server";
// import "server-only";
// export const runtime = "nodejs";

// /* eslint-disable @typescript-eslint/no-explicit-any */

// // ====== Paramètres cron ======
// const TZ = "Europe/Paris";
// const MINUTE_MS = 60_000;
// const DAYS = [
//   "sunday",
//   "monday",
//   "tuesday",
//   "wednesday",
//   "thursday",
//   "friday",
//   "saturday",
// ] as const;
// type DayKey = (typeof DAYS)[number];

// // ====== Helpers de temps (TZ Europe/Paris) ======
// const fmtHHmm = (d: Date) =>
//   d.toLocaleTimeString("fr-FR", {
//     hour: "2-digit",
//     minute: "2-digit",
//     hour12: false,
//     timeZone: TZ,
//   });

// const dayKey = (d: Date): DayKey => {
//   const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
//   return DAYS[local.getDay()];
// };

// const normTimes = (times?: string[]) =>
//   (times ?? []).map((t) => {
//     const [H, M = "00"] = t.split(":");
//     return `${String(parseInt(H, 10)).padStart(2, "0")}:${String(
//       parseInt(M, 10)
//     ).padStart(2, "0")}`;
//   });

// // ====== Hook Next appelé au boot (dev & prod) ======
// export async function register() {
//   const g = globalThis as any;
//   if (g.__CRON_STARTED_MINUTELY__) return;
//   g.__CRON_STARTED_MINUTELY__ = true;

//   let inFlight = false; // anti-chevauchement
//   const ran = new Set<string>(); // anti-doublon par minute (YYYY-MM-DD HH:MM)

//   // Premier tick aligné sur le début de minute
//   const now = new Date();
//   const msToNext = MINUTE_MS - (now.getTime() % MINUTE_MS);
//   setTimeout(() => {
//     tick().catch(console.error);
//     setInterval(() => tick().catch(console.error), MINUTE_MS);
//   }, msToNext);

//   async function tick() {
//     if (inFlight) return;
//     inFlight = true;
//     try {
//       // 🔹 imports dynamiques (aucun import Node au top-level)
//       const { readSiteSettings } = await import("./lib/siteSettings.server");
//       const settings = await readSiteSettings();
//       if (!settings?.autoPublishEnabled) return;

//       const d = new Date();
//       const local = new Date(d.toLocaleString("en-US", { timeZone: TZ }));
//       const key = local.toISOString().slice(0, 16).replace("T", " "); // "YYYY-MM-DD HH:MM"
//       if (ran.has(key)) return;
//       if (ran.size > 2000) ran.clear();

//       const hm = fmtHHmm(local);
//       const dk = dayKey(local);
//       const slots = normTimes(settings.autoPublishSchedule?.[dk]);

//       if (!slots.includes(hm)) return;

//       console.log(`[auto-publish] run @ ${dk} ${hm}`);
//       ran.add(key);

//       // 👉 Appel du CORE (sans revalidation), défini dans app/admin/actions.ts
//       const { saveArticleAutoCore } = await import("./app/admin/actions");
//       const res = await saveArticleAutoCore();

//       if (res?.ok) {
//         // Revalidation côté API (contexte requête valide)
//         const base = settings.url || process.env.SITE_URL;
//         if (base) {
//           await fetch(`${base}/api/revalidate`, {
//             method: "POST",
//             headers: {
//               "content-type": "application/json",
//               "x-cron-key": process.env.CRON_KEY || "",
//             },
//             body: JSON.stringify({
//               paths: res.revalidatePaths || [],
//               layout: !!res.revalidateLayout,
//               tags: [],
//             }),
//           }).catch(() => {});
//         } else {
//           console.warn(
//             "[auto-publish] pas d’URL base (settings.url/SITE_URL) pour la revalidation"
//           );
//         }
//       } else {
//         console.warn("[auto-publish] core ok=false:", (res as any)?.error);
//       }

//       console.log("[auto-publish] done.");
//     } catch (err) {
//       console.error("[auto-publish] tick error:", err);
//     } finally {
//       inFlight = false;
//     }
//   }
// }
