/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/gtag.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function pageview(url: string) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  (window as any).gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function gaEvent(action: string, params: Record<string, any> = {}) {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  (window as any).gtag?.("event", action, params);
}
