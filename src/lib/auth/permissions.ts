import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

/**
 * Helpers d'autorisation côté serveur.
 *
 * ⚠️ C'est ICI qu'est la vraie frontière de sécurité (Server Components,
 * Server Actions, Route Handlers) — pas dans proxy.ts.
 */

/**
 * Retourne l'utilisateur de la session courante, ou null.
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Vrai si l'utilisateur courant possède au moins un des rôles demandés.
 */
export async function hasRole(...roles: Role[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}

/**
 * Exige une session authentifiée. Redirige vers /login sinon.
 * Retourne l'utilisateur pour usage direct.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Exige au moins un des rôles donnés. Redirige si non connecté (/login)
 * ou si connecté sans le rôle (/ — accès refusé).
 */
export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const allowed = roles.some((r) => user.roles.includes(r));
  if (!allowed) {
    redirect("/");
  }
  return user;
}

/**
 * Raccourcis sémantiques fréquents.
 */
export function isAdmin(roles: Role[]): boolean {
  return roles.includes("ADMIN");
}

export function isEditor(roles: Role[]): boolean {
  return roles.includes("EDITOR") || roles.includes("ADMIN");
}

export function canWrite(roles: Role[]): boolean {
  return (
    roles.includes("AUTHOR") ||
    roles.includes("EDITOR") ||
    roles.includes("ADMIN")
  );
}

/**
 * Peut valider/publier le contenu d'un auteur (Éditeur ou Admin).
 */
export function canPublish(roles: Role[]): boolean {
  return roles.includes("EDITOR") || roles.includes("ADMIN");
}

/**
 * Peut inviter de nouveaux auteurs/éditeurs (Éditeur ou Admin).
 */
export function canInvite(roles: Role[]): boolean {
  return roles.includes("EDITOR") || roles.includes("ADMIN");
}
