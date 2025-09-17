// app/api/revalidate/route.ts
import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const key = req.headers.get("x-cron-key");
  if (!process.env.CRON_KEY || key !== process.env.CRON_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const {
    paths = [],
    layout = false,
    tags = [],
  } = await req.json().catch(() => ({}));

  for (const p of paths) {
    revalidatePath(p, layout ? "layout" : undefined);
  }
  for (const t of tags) revalidateTag(t);

  return NextResponse.json({ ok: true, paths, tags, layout });
}
