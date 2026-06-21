"use server";

import { randomBytes } from "crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canInvite } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";

type InviteResult =
  | { ok: true; token: string; url: string }
  | { ok: false; error: string };

/** Durée de validité d'une invitation : 24h. */
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;

/** Rôles qu'une invitation peut attribuer. */
const INVITABLE_ROLES: Role[] = ["AUTHOR", "EDITOR"];

/**
 * Génère un lien d'invitation (Admin ou Éditeur uniquement).
 * Choisit le ou les rôles, un nom de compte et l'email pré-définis.
 * Lien valable 24h, à usage unique.
 *
 * (L'UI de génération est construite en phase 12 ; cette action est la
 * brique métier réutilisable.)
 */
export async function createInvitationAction(input: {
  name: string;
  email: string;
  roles: Role[];
}): Promise<InviteResult> {
  const current = await getCurrentUser();
  if (!current || !canInvite(current.roles)) {
    return { ok: false, error: "Action non autorisée." };
  }

  const roles = input.roles.filter((r) => INVITABLE_ROLES.includes(r));
  if (roles.length === 0) {
    return {
      ok: false,
      error: "Sélectionnez au moins un rôle valide (Auteur ou Éditeur).",
    };
  }

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return { ok: false, error: "Nom de compte invalide." };
  }

  const email = input.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Email invalide." };
  }

  // Empêche d'inviter un email déjà associé à un compte.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cet email." };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.invitation.create({
    data: {
      token,
      name,
      email,
      roles,
      invitedById: current.id,
      expiresAt,
    },
  });

  await logActivity({
    actorId: current.id,
    action: "USER_INVITED",
    targetType: "Invitation",
    detail: `Invitation ${roles.join("+")} pour "${name}" <${email}>`,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  return { ok: true, token, url: `${baseUrl}/invite/${token}` };
}

/**
 * Vérifie qu'une invitation est valide (existe, non utilisée, non expirée).
 * Lecture seule — utilisée par la page d'acceptation.
 */
export async function getInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return null;
  if (invitation.usedAt) return null;
  if (invitation.expiresAt < new Date()) return null;
  return invitation;
}
