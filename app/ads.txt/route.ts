// app/ads.txt/route.ts
import "server-only";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// On part de NEXT_PUBLIC_ADSENSE_CLIENT = "ca-pub-xxxxxxxxxxxx"
const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
// Pour ads.txt, le format attendu est "pub-xxxxxxxxxxxx" (sans "ca-")
const pubId = client.replace(/^ca-/, "");

// Tu peux ajouter des lignes supplémentaires via une env multi-lignes
// (ex: ADS_TXT_EXTRA="example.com, 123, RESELLER, abc\nexample2.com, 456, DIRECT, def")
const extra = (process.env.ADS_TXT_EXTRA || "").trim();

const body =
  [
    pubId
      ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`
      : "# Missing NEXT_PUBLIC_ADSENSE_CLIENT",
    extra && extra,
  ]
    .filter(Boolean)
    .join("\n") + "\n";

export async function GET() {
  return new NextResponse(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
