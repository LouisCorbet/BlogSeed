"use server";

import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth/permissions";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Déconnexion de TOUTES les sessions de l'utilisateur courant :
 * on incrémente sessionVersion, ce qui invalide tous les JWT émis avant.
 * (L'inscription est gérée par la route /api/register.)
 */
export async function revokeAllSessionsAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Non connecté." };

  await prisma.user.update({
    where: { id: user.id },
    data: { sessionVersion: { increment: 1 } },
  });

  await signOut({ redirectTo: "/login" });
  return { ok: true };
}
