// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*"] };

// --- Backoff config ---
const BASE_DELAY_MS = 500; // 1er échec = 500ms
const MAX_DELAY_MS = 8_000; // plafond 8s
const ATTEMPT_TTL_MS = 10 * 60_000; // mémorisation 10 min

// --- SEO / Discrétion ---
const ROBOTS = "noindex, nofollow, noarchive, nosnippet, noimageindex";
// Si true => on répond 404 (discret). Si false => 401 + WWW-Authenticate (popup navigateur).
// const RETURN_404_ON_FAIL = true;

type Attempt = { count: number; last: number };

// Mémoire process-local (pour multi-VM, utiliser Redis/Upstash)
declare global {
  var __AUTH_ATTEMPTS__: Map<string, Attempt> | undefined;
}
const attempts =
  globalThis.__AUTH_ATTEMPTS__ ?? (globalThis.__AUTH_ATTEMPTS__ = new Map());

// Helpers
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// IP via en-têtes, compatible proxy/CDN
function getIP(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "unknown";
}

function decodeBasicToken(b64: string) {
  // Edge runtime: atob() dispo (pas de Buffer)
  const raw = atob(b64);
  const i = raw.indexOf(":");
  const u = i >= 0 ? raw.slice(0, i) : raw;
  const p = i >= 0 ? raw.slice(i + 1) : "";
  return { u, p };
}

// Base headers à ajouter à TOUTES les réponses /admin
function setBaseHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", ROBOTS);
  // Évite toute mise en cache (proxies/navigateurs)
  res.headers.set("Cache-Control", "no-store, max-age=0");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  // Optionnel : réduire la surface d’info
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function middleware(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const user = process.env.ADMIN_USER ?? "";
  const pass = process.env.ADMIN_PASS ?? "";
  const ip = getIP(req);
  const now = Date.now();

  // Purge TTL
  const rec = attempts.get(ip);
  if (rec && now - rec.last > ATTEMPT_TTL_MS) {
    attempts.delete(ip);
  }

  // Vérif Basic Auth
  if (auth?.startsWith("Basic ")) {
    const [, b64] = auth.split(" ");
    const { u, p } = decodeBasicToken(b64);
    if (u === user && p === pass) {
      attempts.delete(ip); // reset au succès
      return setBaseHeaders(NextResponse.next());
    }
  }

  // Échec → incrément + backoff exponentiel avec jitter
  const prev = attempts.get(ip)?.count ?? 0;
  const count = prev + 1;
  attempts.set(ip, { count, last: now });

  const delay =
    Math.min(BASE_DELAY_MS * 2 ** (count - 1), MAX_DELAY_MS) +
    Math.floor(Math.random() * 300); // jitter 0–300ms
  await sleep(delay);

  // Réponse échec (discrète par défaut)
  // if (RETURN_404_ON_FAIL) {
  //   return setBaseHeaders(
  //     new NextResponse("Not found", {
  //       status: 404,
  //     })
  //   );
  // }

  // Variante : 401 avec popup Basic Auth
  return setBaseHeaders(
    new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    })
  );
}
