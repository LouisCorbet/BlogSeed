/* eslint-disable @typescript-eslint/no-explicit-any */
// app/images/[...path]/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const dataBase = path.join(process.cwd(), "data", "images");
const publicBase = path.join(process.cwd(), "public", "images");

function safeJoin(base: string, parts: string[]) {
  const p = path.join(base, ...parts);
  if (!p.startsWith(base)) throw new Error("path traversal");
  return p;
}
function contentType(p: string) {
  const e = p.toLowerCase();
  if (e.endsWith(".webp")) return "image/webp";
  if (e.endsWith(".png")) return "image/png";
  if (e.endsWith(".jpg") || e.endsWith(".jpeg")) return "image/jpeg";
  if (e.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

// ⬇️ NOTE: params est maintenant un *Promise* → on l'attend
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;

  try {
    const fp = safeJoin(dataBase, parts);
    const s = await stat(fp);
    return new NextResponse(createReadStream(fp) as any, {
      headers: {
        "content-type": contentType(fp),
        "content-length": String(s.size),
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {}

  try {
    const fp2 = safeJoin(publicBase, parts);
    const s2 = await stat(fp2);
    return new NextResponse(createReadStream(fp2) as any, {
      headers: {
        "content-type": contentType(fp2),
        "content-length": String(s2.size),
        "cache-control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {}

  return new NextResponse("Not found", { status: 404 });
}
