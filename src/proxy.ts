import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts — remplace middleware.ts depuis Next.js 16.
 *
 * ⚠️ IMPORTANT (sécurité) : proxy.ts n'est PAS une frontière de sécurité.
 * Il fait une redirection précoce (UX) basée sur la simple présence d'un
 * cookie de session — il ne valide pas le token. La vraie vérification des
 * rôles/permissions est faite dans les Server Components / Server Actions /
 * Route Handlers via les helpers de @/lib/auth/permissions (requireUser,
 * requireRole). Ne jamais se reposer sur ce fichier seul.
 */

// Préfixes de routes nécessitant une authentification.
const PROTECTED_PREFIXES = ["/admin", "/mon-compte"];

// Nom du cookie de session selon l'environnement.
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected) {
    const hasSession = SESSION_COOKIES.some((name) =>
      request.cookies.has(name),
    );
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)"],
};
