// lib/jobs.ts
export async function twiceDailyJob() {
  // Ta logique ici (rebuild sitemap, purge cache, etc.)
  console.log("[cron] twiceDailyJob", new Date().toISOString());
}
