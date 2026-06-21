import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed initial : crée un compte admin et les settings par défaut.
 * Les identifiants admin sont lus depuis les variables d'environnement
 * pour le premier démarrage (à changer ensuite depuis "Mon compte").
 */
async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

  // ----- Compte admin -----
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrateur",
        slug: "admin",
        passwordHash,
        roles: ["ADMIN", "EDITOR", "AUTHOR", "READER"],
      },
    });
    console.log(`✓ Compte admin créé : ${adminEmail}`);
  } else {
    console.log(`• Compte admin déjà existant : ${adminEmail}`);
  }

  // ----- Settings par défaut -----
  const defaults: Record<string, string> = {
    "blog.title": "Mon Blog",
    "blog.description": "Un blog propulsé par Next.js",
    "blog.socialLinks": "[]",
    "auth.googleEnabled": "false",
    "analytics.gaEnabled": "false",
    "analytics.plausibleEnabled": "false",
    "gdpr.bannerEnabled": "true",
    "gdpr.bannerText":
      "Ce site utilise des cookies pour la mesure d'audience. Vous pouvez accepter ou refuser.",
    "theme.config": JSON.stringify({
      primary: "#2563eb",
      secondary: "#7c3aed",
      background: "#ffffff",
      foreground: "#0f172a",
      link: "#2563eb",
      radius: "0.5rem",
      font: "system-ui",
      dark: {
        background: "#0f172a",
        foreground: "#f1f5f9",
        link: "#60a5fa",
      },
    }),
    "landing.sections": JSON.stringify([
      { type: "hero", enabled: true, order: 0 },
      { type: "recent", enabled: true, order: 1, count: 9 },
      { type: "mostViewed", enabled: true, order: 2, count: 6 },
      { type: "mostLiked", enabled: true, order: 3, count: 6 },
      { type: "featured", enabled: true, order: 4, count: 6 },
      { type: "byCategory", enabled: true, order: 5, count: 6 },
      { type: "quizzes", enabled: false, order: 6, count: 6 },
    ]),
    "gamification.enabled": "false",
    "gamification.points": JSON.stringify({
      ACCOUNT_CREATED: 10,
      COMMENT: 5,
      REPLY_RECEIVED: 2,
      COMMENT_LIKE_RECEIVED: 1,
      ARTICLE_LIKE: 1,
      NEWSLETTER: 5,
      QUIZ_COMPLETE: 3,
    }),
    "rss.itemCount": "20",
  };

  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {}, // ne pas écraser si déjà personnalisé
      create: { key, value },
    });
  }
  console.log(`✓ ${Object.keys(defaults).length} settings par défaut initialisés`);

  // ----- Niveaux de gamification par défaut -----
  const levels = [
    { name: "Lecteur", threshold: 0, order: 0 },
    { name: "Contributeur", threshold: 50, order: 1 },
    { name: "Expert", threshold: 200, order: 2 },
    { name: "Ambassadeur", threshold: 500, order: 3 },
  ];
  for (const level of levels) {
    await prisma.gamificationLevel.upsert({
      where: { threshold: level.threshold },
      update: {},
      create: level,
    });
  }
  console.log(`✓ ${levels.length} niveaux de gamification initialisés`);

  // ----- Pages légales (templates pré-remplis) -----
  const pages = [
    {
      slug: "mentions-legales",
      title: "Mentions légales",
      content:
        "<h2>Éditeur du site</h2><p>[Nom / Raison sociale]</p><p>[Adresse]</p><p>[Email de contact]</p><h2>Hébergement</h2><p>[Nom de l'hébergeur]</p><p>[Adresse de l'hébergeur]</p><h2>Directeur de la publication</h2><p>[Nom]</p>",
      order: 0,
    },
    {
      slug: "politique-de-confidentialite",
      title: "Politique de confidentialité",
      content:
        "<h2>Données collectées</h2><p>[Décrire les données collectées : compte, commentaires, newsletter...]</p><h2>Utilisation des cookies</h2><p>[Décrire l'usage des cookies de mesure d'audience]</p><h2>Vos droits</h2><p>[Droit d'accès, de rectification, de suppression — contact DPO]</p>",
      order: 1,
    },
    {
      slug: "cgu",
      title: "Conditions générales d'utilisation",
      content:
        "<h2>Objet</h2><p>[Décrire l'objet du site]</p><h2>Comptes utilisateurs</h2><p>[Règles de création et d'utilisation des comptes]</p><h2>Contenu publié</h2><p>[Règles concernant les commentaires et contributions]</p>",
      order: 2,
    },
  ];
  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log(`✓ ${pages.length} pages légales (templates) initialisées`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
