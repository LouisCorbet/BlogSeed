import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { inviteAcceptSchema } from "@/lib/auth/schemas";

/**
 * Accepte une invitation : crée le compte avec le(s) rôle(s) pré-assigné(s)
 * et marque l'invitation comme utilisée (transaction atomique pour éviter
 * tout usage concurrent). Retourne l'email pour la connexion côté client.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = inviteAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { token, name, password } = parsed.data;

  try {
    const email = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({ where: { token } });
      if (
        !invitation ||
        invitation.usedAt ||
        invitation.expiresAt < new Date()
      ) {
        throw new Error("Invitation invalide ou expirée.");
      }
      if (!invitation.email) {
        throw new Error(
          "Cette invitation ne contient pas d'email. Contactez l'administrateur.",
        );
      }

      const existing = await tx.user.findUnique({
        where: { email: invitation.email },
      });
      if (existing) {
        throw new Error("Un compte existe déjà avec cet email.");
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const base = slugify(name, { lower: true, strict: true }) || "auteur";
      let slug = base;
      let i = 1;
      while (await tx.user.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`;
      }

      await tx.user.create({
        data: {
          name,
          email: invitation.email,
          passwordHash,
          slug,
          roles: Array.from(
            new Set([...invitation.roles, "READER" as Role]),
          ),
        },
      });

      await tx.invitation.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      return invitation.email;
    });

    return NextResponse.json({ ok: true, email });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Une erreur est survenue.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
