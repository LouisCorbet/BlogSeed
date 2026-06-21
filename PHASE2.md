# Phase 2 — Authentification, rôles, invitations

## Ce qui est livré

### Configuration Next-Auth v5 (stratégie JWT)
- `src/lib/auth/index.ts` — config centrale. Stratégie **JWT** (imposée par Credentials).
- `src/lib/auth/providers.ts` — providers construits dynamiquement ; **Google OAuth lu depuis la BDD** (table Setting), activé seulement si configuré.
- `src/lib/auth/schemas.ts` — validation Zod (login, register, invitation).
- `src/types/next-auth.d.ts` — types augmentés (`id`, `roles` sur la session).
- `src/app/api/auth/[...nextauth]/route.ts` — handler.

### Révocation de session ("déconnexion de toutes les sessions")
- Champ `User.sessionVersion`. Le callback `jwt` compare la version du token à la base ; si elle diffère → token invalidé.
- `revokeAllSessionsAction()` (dans `actions.ts`) incrémente `sessionVersion`.

### Inscription (ouverte, rôle Lecteur)
- `src/app/api/register/route.ts` + `components/auth/register-form.tsx` + page `/register`.

### Connexion
- `components/auth/login-form.tsx` + page `/login`. Bouton Google affiché seulement si activé.

### Invitations (Admin / Éditeur)
- `createInvitationAction()` génère un lien (rôle + nom + email pré-définis, 24h, usage unique).
- Page `/invite/[token]` + `api/invite/accept` créent le compte et connectent l'invité.
- Validation transactionnelle (anti double-usage).

### Permissions
- `src/lib/auth/permissions.ts` — `requireUser`, `requireRole`, `hasRole`, `isAdmin`, `canWrite`, `canPublish`, `canInvite`.
- ⚠️ La sécurité réelle est dans ces helpers (Server Components/Actions), **pas** dans `proxy.ts` (qui ne fait qu'une redirection précoce sur présence de cookie).

### Journalisation
- `src/lib/activity.ts` — `logActivity()` (table ActivityLog).

---

## ⚠️ À tester au runtime (non vérifiable hors environnement)

Le client Prisma n'a pas pu être généré dans l'environnement de génération
(réseau bloquant le téléchargement des binaires Prisma), donc le typecheck
complet et l'exécution n'ont pas été lancés ici. À vérifier en local :

1. **Migration** : `npx prisma migrate dev --name auth_jwt` (ajoute `sessionVersion`, retire `Session`).
2. **Typecheck** : `npx tsc --noEmit` après `npx prisma generate`.
3. **Inscription** : créer un compte sur `/register` → connexion auto → retour accueil.
4. **Connexion** : se déconnecter, se reconnecter sur `/login`.
5. **Révocation** : le point le plus sensible. Se connecter, puis appeler
   `revokeAllSessionsAction` → vérifier que la session est invalidée.
   Le mécanisme repose sur le retour `null` du callback `jwt` ; si le
   comportement diffère sur la version beta installée de next-auth, on
   ajustera (alternative documentée : vérifier `sessionVersion` dans le
   callback `session` et forcer une déconnexion côté client).
6. **Invitation** : générer un lien via `createInvitationAction` (UI admin
   en phase 12 ; testable via un appel direct ou un script), ouvrir
   `/invite/[token]`, créer le compte, vérifier les rôles attribués.
7. **Google OAuth** : renseigner les credentials dans la table Setting
   (`auth.googleEnabled=true`, `auth.googleClientId`, `auth.googleClientSecret`),
   redémarrer, vérifier l'apparition du bouton Google.

---

## Note importante sur Google OAuth

Next-Auth lit les providers à l'initialisation. Les credentials Google étant
en BDD, **tout changement nécessite un redémarrage** du serveur (mécanisme
Socket Proxy prévu en phase 8/12). Tant que les credentials ne sont pas en
base, seul l'email/mot de passe est disponible — c'est le comportement voulu.
