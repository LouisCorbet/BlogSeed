import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/auth/schemas";

/**
 * Inscription publique (rôle Lecteur). Crée le compte ; la connexion
 * est ensuite déclenchée côté client via signIn("credentials").
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Slug d'auteur unique.
  const base = slugify(name, { lower: true, strict: true }) || "membre";
  let slug = base;
  let i = 1;
  while (await prisma.user.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      slug,
      roles: ["READER"],
    },
  });

  return NextResponse.json({ ok: true });
}
