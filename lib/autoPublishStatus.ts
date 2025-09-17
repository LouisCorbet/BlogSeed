/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/autoPublishStatus.ts
import "server-only";

export type AutoPublishStatus = {
  step: string; // "init" | "ai" | "image" | "image-fallback" | "html" | "index" | "revalidate" | "done" | "error" | "idle"
  detail?: string;
  time: string; // ISO date
  running: boolean; // pratique côté UI
};

const g = globalThis as any;
if (!g.__AUTO_PUBLISH_STATUS__) {
  g.__AUTO_PUBLISH_STATUS__ = {
    step: "idle",
    time: new Date().toISOString(),
    running: false,
  } as AutoPublishStatus;
}

export function updateStatus(step: string, detail?: string) {
  const running = !(step === "done" || step === "error" || step === "idle");
  g.__AUTO_PUBLISH_STATUS__ = {
    step,
    detail,
    time: new Date().toISOString(),
    running,
  } as AutoPublishStatus;
}

export function getStatus(): AutoPublishStatus {
  return g.__AUTO_PUBLISH_STATUS__ as AutoPublishStatus;
}
