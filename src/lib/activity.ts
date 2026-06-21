import { prisma } from "@/lib/prisma";

/**
 * Journalise une action dans le log d'activité (table ActivityLog).
 * Utilisé à travers le projet : publication d'article, suppression de
 * commentaire, invitation d'utilisateur, validation de contenu, etc.
 *
 * Ne fait jamais échouer l'action appelante : en cas d'erreur de log,
 * on se contente de la signaler en console.
 */
export async function logActivity(entry: {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        detail: entry.detail ?? null,
      },
    });
  } catch (error) {
    console.error("[activity] Échec de journalisation :", error);
  }
}
