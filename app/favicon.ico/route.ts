import "server-only";
import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const brandDir = path.join(process.cwd(), "data");

async function tryServe(file: string, type: string) {
  const s = await stat(file);
  const buffer = await readFile(file);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": type,
      "content-length": String(s.size),
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
export async function GET() {
  try {
    // ordre de préférence: .ico → .png → .webp
    const ico = path.join(brandDir, "favicon.ico");
    return await tryServe(ico, "image/x-icon");
  } catch {}
  try {
    const png = path.join(brandDir, "favicon.png");
    return await tryServe(png, "image/png");
  } catch {}
  try {
    const webp = path.join(brandDir, "favicon.webp");
    return await tryServe(webp, "image/webp");
  } catch {}
  // fallback sur public/favicon.ico si présent
  try {
    const pub = path.join(process.cwd(), "public", "favicon.ico");
    return await tryServe(pub, "image/x-icon");
  } catch {}
  return new NextResponse("Not found", { status: 404 });
}
