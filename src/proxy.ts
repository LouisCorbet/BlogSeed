import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts — remplace middleware.ts depuis Next.js 16.
 * S'exécute sur le runtime Node.js, avant le rendu des routes.
 *
 * ⚠️ IMPORTANT (sécurité) : proxy.ts n'est PAS une frontière de sécurité.
 * Il sert à rediriger tôt (UX), mais la vraie vérification des rôles et
 * permissions DOIT être faite dans les Server Components, Server Actions
 * et Route Handlers (via auth()). Ne jamais se reposer sur ce fichier seul
 * pour protéger /admin ou les données sensibles.
 *
 * La logique d'authentification réelle est branchée en phase 2.
 */
export function proxy(request: NextRequest) {
  // Phase 1 : aucune redirection active.
  // Phase 2 : redirection vers /login pour les routes protégées non authentifiées,
  //           + gestion des redirections 301/302 issues de la table Redirect.
  return NextResponse.next();
}

export const config = {
  // S'applique à toutes les routes sauf les assets statiques et l'API d'auth.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|api/auth).*)",
  ],
};
