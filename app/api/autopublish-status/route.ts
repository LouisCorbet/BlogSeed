import { NextResponse } from "next/server";
import { getStatus } from "@/lib/autoPublishStatus";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getStatus());
}
