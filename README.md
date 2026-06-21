# Plateforme Blog — Next.js (type WordPress)

Plateforme blog auto-hébergée, modulaire et duplicable, déployable via Docker Compose.

> **État actuel : Phase 1** — structure, schéma de base de données et infrastructure Docker.

---

## Stack

- **Next.js 16** (App Router, LTS) en build `standalone`
- **React 19.2**
- **PostgreSQL 16** + **Prisma**
- **Next-Auth v5** (sessions en BDD)
- **Caddy** (reverse proxy + HTTPS automatique)
- **Docker Socket Proxy** (redémarrage sécurisé du container)
- **Tailwind CSS** + variables CSS dynamiques
- **Sharp** (optimisation images)

> Next 16 : le bundler par défaut est Turbopack, `middleware.ts` est remplacé par `proxy.ts`, et le caching est explicite (`use cache`). Node.js ≥ 20.9 requis.

---

## Architecture Docker

| Service | Rôle |
|---|---|
| `app` | Application Next.js (port interne 3000) |
| `db` | PostgreSQL + volume persistant |
| `caddy` | Reverse proxy, HTTPS, en-têtes de sécurité |
| `socket-proxy` | Filtre l'accès Docker (autorise uniquement `restart`) |

---

## Démarrage

### 1. Configuration

```bash
cp .env.example .env
```

Éditez `.env` et renseignez :
- `POSTGRES_PASSWORD` — un mot de passe fort
- `DATABASE_URL` — avec le même mot de passe
- `NEXTAUTH_SECRET` — généré via `openssl rand -base64 32`
- `NEXTAUTH_URL` et `DOMAIN` — votre domaine

### 2. Build et lancement

```bash
docker compose up -d --build
```

Au démarrage, le container `app` applique automatiquement les migrations Prisma (`prisma migrate deploy`).

### 3. Initialisation des données (premier démarrage)

```bash
# Crée le compte admin et les settings par défaut
SEED_ADMIN_EMAIL=vous@domaine.fr \
SEED_ADMIN_PASSWORD=votreMotDePasse \
docker compose exec app npx tsx prisma/seed.ts
```

> Pensez à changer le mot de passe admin depuis « Mon compte » après la première connexion.

---

## Configuration applicative

Toute la configuration (Google OAuth, SMTP, Analytics, AdSense, thème, RGPD, gamification…) se fait **depuis l'admin**, pas dans le `.env`. Ces valeurs sont stockées en base dans la table `Setting`.

Seules 3 variables restent dans le `.env` car nécessaires au démarrage : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`.

---

## Développement local

```bash
npm install
npx prisma migrate dev      # crée la BDD locale + applique les migrations
npm run db:seed             # données initiales
npm run dev                 # serveur de dev sur http://localhost:3000
```

Pour une base locale, ajustez `DATABASE_URL` vers un PostgreSQL local (ou lancez seulement le service `db` via `docker compose up db`).

---

## Modèle de données

Le schéma complet est dans [`prisma/schema.prisma`](prisma/schema.prisma). Entités principales :

- **Utilisateurs & auth** : `User`, `Account`, `Session`, `Invitation` (rôles cumulables : Reader / Author / Editor / Admin)
- **Contenu** : `Article` (+ `ArticleVersion`, `FaqItem`), `Quiz` (+ profils, questions, réponses pondérées)
- **Taxonomie** : `Category`, `Tag`
- **Interactions** : `Comment`, `ArticleLike`, `CommentLike`, `Favorite`
- **Affiliation** : `AffiliateProduct`
- **SEO** : `Redirect`
- **Communauté** : `NewsletterSubscriber`, `PointsHistory`, `GamificationLevel`
- **Système** : `Page`, `ActivityLog`, `Setting`

---

## Notes Next.js 16

- **`src/proxy.ts`** remplace `middleware.ts`. ⚠️ Ce n'est **pas** une frontière de sécurité : il sert à la redirection précoce (UX). Les vraies vérifications de rôle/permission se font dans les Server Components, Server Actions et Route Handlers via `auth()`. (Branché en phase 2.)
- Server Actions stables (limite de body à 10 Mo pour les uploads).
- Toujours rester sur **16.2.6+** (13 CVE corrigées en mai 2026).

---

## Roadmap des phases

1. ✅ **Phase 1** — Structure, Prisma, Docker
2. ✅ **Phase 2** — Auth, rôles, invitations
3. ⬜ **Phase 3** — Frontend public
4. ⬜ **Phase 4** — Admin de base
5. ⬜ **Phase 5** — Quizz
6. ⬜ **Phase 6** — Utilisateurs (compte, commentaires, likes)
7. ⬜ **Phase 7** — SEO avancé
8. ⬜ **Phase 8** — Newsletter, analytics, AdSense, RGPD
9. ⬜ **Phase 9** — Affiliation
10. ⬜ **Phase 10** — Apparence & thème
11. ⬜ **Phase 11** — Gamification
12. ⬜ **Phase 12** — Polish (dashboard, logs, import WordPress)
