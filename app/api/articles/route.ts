// import { NextRequest, NextResponse } from "next/server";
// import { readIndex, upsert, remove } from "@/lib/store";
// import createDOMPurify from "isomorphic-dompurify";
// import { JSDOM } from "jsdom";

// function isAuth(req: NextRequest) {
//   return req.headers.get("x-admin") === process.env.ADMIN_TOKEN;
// }

// export async function GET() {
//   const list = await readIndex();
//   return NextResponse.json(list);
// }

// export async function POST(req: NextRequest) {
//   if (!isAuth(req)) return new NextResponse("Forbidden", { status: 403 });
//   const { slug, title, author, htmlContent, date } = await req.json();

//   // Sanitize le HTML
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const window = new JSDOM("").window as any;
//   const DOMPurify = createDOMPurify(window);
//   const safe = DOMPurify.sanitize(htmlContent, {
//     USE_PROFILES: { html: true },
//   });

//   const saved = await upsert({ slug, title, author, htmlContent: safe, date });
//   return NextResponse.json(saved);
// }

// export async function PUT(req: NextRequest) {
//   if (!isAuth(req)) return new NextResponse("Forbidden", { status: 403 });
//   const { slug, title, author, htmlContent, date } = await req.json();

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const window = new JSDOM("").window as any;
//   const DOMPurify = createDOMPurify(window);
//   const safe = DOMPurify.sanitize(htmlContent, {
//     USE_PROFILES: { html: true },
//   });

//   const saved = await upsert({ slug, title, author, htmlContent: safe, date });
//   return NextResponse.json(saved);
// }

// export async function DELETE(req: NextRequest) {
//   if (!isAuth(req)) return new NextResponse("Forbidden", { status: 403 });
//   const { slug } = await req.json();
//   await remove(slug);
//   return NextResponse.json({ ok: true });
// }
