# Spécifications — Plateforme Blog Next.js (type WordPress)

> Document de référence complet pour la génération du projet. Toutes les décisions techniques et fonctionnelles y sont consignées.

---

## 1. Vision du projet

Une plateforme blog auto-hébergée, modulaire et duplicable selon le thème du blog, à la manière de WordPress mais construite sur une stack moderne. Le projet est pensé pour être déployé via Docker Compose sur un serveur personnel, sans dépendance à des services cloud tiers (sauf optionnels).

---

## 2. Stack technique

| Composant | Choix |
|---|---|
| Framework | Next.js 16+ (App Router, LTS) — bundler Turbopack par défaut |
| Runtime | React 19.2, Node.js ≥ 20.9 |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Authentification | Next-Auth v5 |
| Éditeur rich text | TipTap |
| Éditeur HTML brut | Textarea avec coloration syntaxique |
| CSS | Tailwind CSS + variables CSS dynamiques |
| Optimisation images | Sharp |
| Reverse proxy | Caddy |
| Conteneurisation | Docker Compose |
| Stockage images | Volume Docker local (`./uploads:/app/public/uploads`) |

---

## 3. Architecture Docker Compose

```yaml
services:
  app:           # Next.js (build production)
  db:            # PostgreSQL + volume persistant
  caddy:         # Reverse proxy + HTTPS automatique
  socket-proxy:  # Docker Socket Proxy (sécurité redémarrage)
```

### Stockage des images

Les images uploadées sont servies depuis `/public/uploads/`. Sharp génère à l'upload :
- Une version **WebP** optimisée (pleine résolution)
- Un **thumbnail** redimensionné pour les listes d'articles
- Les dimensions stockées en base pour éviter le layout shift (Core Web Vitals)
- Option **AVIF** disponible (meilleure compression, activable depuis l'admin)

Pas de médiathèque centralisée — les images sont uploadées directement depuis l'éditeur d'article ou les champs dédiés (favicon, avatar, couverture).

### Redémarrage sécurisé du serveur

Certains paramètres (Google OAuth) nécessitent un redémarrage du container Next.js pour être pris en compte. Ce redémarrage est déclenché depuis l'admin via **Docker Socket Proxy** (image `tecnativa/docker-socket-proxy`) :

- Le container `app` ne monte pas directement `/var/run/docker.sock`
- Il passe par le `socket-proxy` qui n'autorise que `docker restart` sur le container `app`
- Toute autre commande Docker est bloquée
- L'admin voit un message "Redémarrage en cours... (~5 secondes)" puis une confirmation

---

## 4. Rôles utilisateurs

Les rôles sont **cumulables** (un compte peut avoir plusieurs rôles).

| Rôle | Permissions |
|---|---|
| **Lecteur** | Compte de base. Peut commenter, liker, gérer ses favoris. Pas d'accès éditorial. |
| **Auteur** | Peut créer et soumettre des articles et quizz. Ses contenus nécessitent une validation avant publication. Accès à ses propres statistiques (vues, likes, commentaires). |
| **Éditeur** | Peut écrire, éditer tous les articles et quizz, publier, valider les contenus des Auteurs, et inviter des Auteurs ou Éditeurs. |
| **Admin** | Accès total. Gestion des utilisateurs, de la configuration globale, des rôles, de l'admin panel complet. |

### Système d'invitation

- Un Admin ou Éditeur peut générer un **lien d'invitation unique**.
- Au moment de la génération, il choisit : le **rôle** attribué et le **nom du compte** (modifiable ensuite depuis la gestion des utilisateurs).
- Le lien expire après **24h** et est **à usage unique**.
- En cliquant sur le lien, l'invité crée son compte avec le rôle pré-assigné.

---

## 5. Authentification & comptes utilisateurs

- Inscription/connexion par **email + mot de passe** ou **Google OAuth**
- Sessions gérées par Next-Auth v5 avec stockage en **BDD** (permet la déconnexion de toutes les sessions)

### Page "Mon compte" (tous les utilisateurs connectés)

- Informations personnelles : nom, avatar (upload), email
- Avatar par défaut : initiales dans un cercle coloré (si pas d'upload)
- Sécurité : changement de mot de passe, déconnexion de toutes les sessions
- Préférences : mode sombre/clair, consentement cookies
- Favoris (articles likés/sauvegardés)
- Historique des commentaires
- Résultats de quizz passés
- Si gamification activée : total de points, niveau actuel, historique des points
- Si Auteur : statistiques de ses articles (vues, likes, commentaires)

---

## 6. Pages publiques

### 6.1 Landing page (style Netflix)

Sections configurables depuis l'admin (ordre et visibilité paramétrables) :

- **Hero** — article épinglé ou le plus récent, grand format
- **Les plus récents** — grille paginée
- **Les plus vus** — ligne dédiée
- **Les plus likés** — ligne dédiée
- **Sélection de l'éditeur** — articles marqués "featured" manuellement
- **Par catégorie** — une section par catégorie active
- **Quizz récents / populaires** — section optionnelle
- Infos générales du blog configurables (titre, description, liens sociaux)

### 6.2 Page article

- Contenu de l'article (rich text ou HTML)
- **Image de couverture** (full + thumbnail)
- **Temps de lecture estimé**
- **Barre de progression de lecture** (haut de page, pendant le scroll)
- **Table des matières automatique** générée depuis les titres H2/H3
- **Fil d'Ariane (breadcrumb)** avec structured data
- **Tags** associés (cliquables → page tag)
- **Catégorie** de l'article (cliquable → page catégorie)
- **Auteur** avec lien vers sa page
- **Articles liés** (même catégorie/tags)
- **Section FAQ** (si renseignée)
- **Boutons de partage social** : Twitter/X, LinkedIn, copie du lien
- **Likes** (utilisateurs connectés)
- **Commentaires** avec réponses (thread 1 niveau, utilisateurs connectés)
- **Encart "disclosure affiliation"** automatique si l'article contient des produits affiliés
- **Bloc produit affilié** insérable (image, nom, description, bouton CTA)
- **Suppression de commentaires** visible uniquement pour les Admin (directement sur le front)
- Si gamification activée : badge niveau affiché à côté du nom de chaque commentateur

### 6.3 Page tag

- Liste paginée des articles associés au tag

### 6.4 Page catégorie

- Liste paginée des articles de la catégorie

### 6.5 Page auteur (`/auteur/[slug]`)

- Bio de l'auteur, avatar
- Liste paginée de ses articles publiés

### 6.6 Page produits affiliés (`/produits`)

- Agrégation de tous les produits affiliés
- Filtres par catégorie
- Fiche par produit avec structured data `Product`
- Stats de clics visibles en admin

### 6.7 Page recherche

- Recherche par mots-clés (SQL LIKE)
- Filtres : catégorie, tag, auteur, date
- Résultats : articles et quizz mélangés (avec indicateur de type)

### 6.8 Page "Mon compte"

Voir section 5.

### 6.9 Pages légales

- Mentions légales, Politique de confidentialité, CGU
- Éditables en rich text depuis l'admin
- Templates pré-remplis avec champs à compléter
- Slug propre par page
- Affichées dans le footer (ordre configurable depuis l'admin)

### 6.10 Page 404

- Personnalisable depuis l'admin

### 6.11 Page liste des quizz (`/quiz`)

- Liste paginée de tous les quizz publiés
- Filtres par catégorie/tag

### 6.12 Page quizz (`/quiz/[slug]`)

- Présentation du quizz (titre, description, image de couverture)
- Questions affichées une par une ou toutes à la suite (configurable par quizz)
- Résultat personnalisé à la fin (nom du profil, description, image)
- **Boutons de partage social** sur la page de résultat
- Résultat sauvegardé sur le profil utilisateur connecté
- Si gamification activée : points attribués à la completion du quizz

### 6.13 Pagination

Toutes les listes (landing, tags, catégories, recherche, quizz) utilisent la **pagination** (et non l'infinite scroll) — meilleure indexation Google et meilleures performances.

---

## 7. SEO technique

### Métadonnées dynamiques

- `title`, `description`, `canonical`, `og:*`, `twitter:*`
- Générées via `generateMetadata()` de Next.js App Router
- **OG images** générées dynamiquement via `next/og`
- **Balise hreflang** prête à l'emploi (slot vide si pas de multilingue)

### Structured data (JSON-LD)

| Page | Schéma |
|---|---|
| Article | `Article`, `BreadcrumbList`, `Person` (auteur) |
| Article avec FAQ | `FAQPage` |
| Quizz | `Quiz` |
| Auteur | `Person` |
| Produit affilié | `Product` |
| Blog | `Organization` |
| Toutes pages | `BreadcrumbList` |

### Fichiers techniques

- `sitemap.xml` généré dynamiquement (articles, quizz, pages, catégories, tags, auteurs)
- `robots.txt` généré dynamiquement
- Flux **RSS** généré dynamiquement

### Performance

- **ISR** (Incremental Static Regeneration) avec délai de revalidation configurable par article depuis l'admin
- Images en **WebP** + thumbnail Sharp
- **Lazy loading** des commentaires (chargés au scroll)
- **Compression AVIF** en option (Sharp)

### Liens affiliés

- Redirection interne `/go/[slug]` → lien externe
- **302** (temporaire) + `rel="nofollow sponsored"`
- Clics trackés en base de données

### Slug et redirections

- Slug auto-généré depuis le titre, modifiable manuellement
- Si le slug d'un article ou quizz change → **redirection 301 automatique** créée
- Redirections 301 manuelles configurables depuis l'admin

---

## 8. Interface d'administration (`/admin`)

Accessible uniquement aux Admin et Éditeurs (selon les sections).

### 8.1 Tableau de bord

- Articles publiés (total)
- Quizz publiés (total)
- Vues totales (7 derniers jours)
- Nouveaux abonnés newsletter (cette semaine)
- Nouveaux utilisateurs (cette semaine)
- Raccourcis vers les actions fréquentes

### 8.2 Gestion des articles

- Liste des articles avec statut (brouillon, soumis, planifié, publié)
- **File de validation** : articles soumis par les Auteurs, validables par Éditeur/Admin
- Création / édition avec :
  - Toggle **rich text (TipTap)** / **HTML brut**
  - **Sauvegarde automatique du brouillon** toutes les X secondes
  - **Historique des versions** (retour à une version précédente)
  - **Prévisualisation** avant publication (rendu public sans publier)
  - Slug (auto + modifiable)
  - Image de couverture (upload direct)
  - Catégorie, tags (multi-select)
  - FAQ (champ dédié : liste de questions/réponses)
  - Produits affiliés insérables comme blocs
  - Programmation de la date de publication
  - Marquer comme "featured" ou "épinglé"
  - Délai de revalidation ISR
  - Activation de l'encart disclosure affiliation

### 8.3 Gestion des quizz

- Liste des quizz avec statut (brouillon, soumis, planifié, publié)
- **File de validation** : quizz soumis par les Auteurs, validables par Éditeur/Admin
- Éditeur dédié :
  - Titre, slug, description, image de couverture
  - Création des **profils résultats** (nom, description, image)
  - Création des **questions** (texte + image optionnelle)
  - Pour chaque question : création des **réponses** avec association à un ou plusieurs profils et **poids** (ex: réponse A donne +2 au profil "Aventurier", +1 au profil "Calme")
  - Mode d'affichage : questions une par une ou toutes à la suite
  - Catégorie, tags
  - Programmation de la date de publication
  - **Sauvegarde automatique du brouillon**
  - **Prévisualisation** avant publication

### 8.4 Gestion des tags

- CRUD complet des tags
- Association aux articles et quizz depuis l'éditeur

### 8.5 Gestion des catégories

- CRUD complet des catégories
- Association aux articles et quizz depuis l'éditeur

### 8.6 Gestion des utilisateurs (Admin uniquement)

- Liste de tous les comptes
- Modification des rôles (cumulables)
- Modification du nom du compte
- Suppression de compte
- Génération de liens d'invitation (rôle + nom pré-définis, 24h, usage unique)
- Si gamification activée : total de points et niveau visible par utilisateur

### 8.7 Newsletter

- Liste des abonnés (email, date d'inscription)
- Export CSV
- Template de l'email d'envoi (rich text, variables disponibles : titre article, extrait, lien, image)
- Envoi automatique à chaque publication d'article
- Configuration SMTP depuis l'admin (host, port, user, password, from) — stockée en BDD

### 8.8 Produits affiliés

- CRUD des produits (indépendant des articles)
- Association à plusieurs articles
- Stats de clics par produit

### 8.9 Redirections

- CRUD des redirections 301 manuelles (`/ancienne-url` → `/nouvelle-url`)
- Les redirections automatiques (slug modifié) y apparaissent aussi

### 8.10 Apparence & thème

- **Couleurs** (primaire, secondaire, fond, texte, liens)
- **Border-radius** (boutons, cards, images)
- **Police** (sélection Google Fonts)
- **Mode sombre** : configuration des couleurs spécifiques au mode sombre
- Variables CSS générées dynamiquement et appliquées globalement
- **Favicon** : upload depuis l'admin

### 8.11 Landing page

- Configuration des sections (ordre, visibilité, nombre d'articles/quizz par section)
- Infos générales : titre du blog, description, liens sociaux

### 8.12 Analytics

- **Compteur de vues** par article/quizz (stocké en base, sans cookie)
- **Google Analytics** : activation/désactivation, ID de tag configurable — stocké en BDD, redémarrage auto du container via Socket Proxy à la sauvegarde
- **Plausible** : activation/désactivation, domaine configurable
- Le chargement de GA et Plausible est **conditionné au consentement cookies** (si bandeau RGPD actif)

### 8.13 AdSense

- Emplacements prédéfinis dans les layouts (avant article, après article, sidebar, etc.)
- Par emplacement : activation/désactivation, ID client, ID bloc
- Balise `<script>` AdSense injectée conditionnellement (consentement cookies requis)

### 8.14 RGPD & cookies

- Activation/désactivation du bandeau de consentement cookies
- Personnalisation du texte du bandeau
- GA, Plausible et AdSense ne se chargent **que** si l'utilisateur a accepté
- Préférences stockées dans un cookie local (pas de BDD)
- Modifiable depuis "Mon compte" pour les utilisateurs connectés

### 8.15 Pages légales & footer

- Édition des pages légales (mentions légales, politique de confidentialité, CGU) en rich text
- Templates pré-remplis disponibles
- Configuration du footer : quelles pages y apparaissent, dans quel ordre

### 8.16 Page 404

- Contenu personnalisable depuis l'admin

### 8.17 Logs d'activité

- Historique des actions : article publié par X, commentaire supprimé par Y, utilisateur invité par Z, quizz validé par W, etc.
- Visible par les Admin

### 8.18 Import WordPress

- Import d'un export XML WordPress (articles, catégories, tags, auteurs)

### 8.19 Configuration Google OAuth

- Client ID et Client Secret éditables depuis l'admin — stockés en BDD
- Redémarrage automatique du container `app` via Socket Proxy à la sauvegarde
- Message d'information affiché pendant le redémarrage (~5 secondes)

### 8.20 Gamification

- **Activation / désactivation globale** — si désactivé, aucun badge, aucun point, aucune mention de niveaux nulle part dans l'interface publique ou admin
- Configuration des **points par action** :

| Action | Points par défaut |
|---|---|
| Création de compte | +10 |
| Publier un commentaire | +5 |
| Recevoir une réponse à son commentaire | +2 |
| Recevoir un like sur son commentaire | +1 |
| Liker un article | +1 |
| S'abonner à la newsletter | +5 |
| Compléter un quizz | +3 |

- Configuration des **niveaux** : nom personnalisable, seuil de points (ex: 0 pts = Lecteur, 50 pts = Contributeur, 200 pts = Expert, 500 pts = Ambassadeur)
- Les badges de niveau sont affichés sur le profil utilisateur et à côté du nom dans les commentaires (si gamification activée)

---

## 9. Notifications email

- Un utilisateur reçoit un email quand quelqu'un répond à son commentaire
- Configuration SMTP partagée avec la newsletter (section 8.7)

---

## 10. Modération des commentaires

- Pas de file d'attente : les commentaires sont publiés directement
- Un **Admin** peut supprimer un commentaire directement depuis la page publique (bouton visible uniquement si connecté Admin)
- Un **Admin** peut aussi supprimer depuis l'admin panel

---

## 11. Flux et fichiers techniques

| Fichier | Généré dynamiquement |
|---|---|
| `/sitemap.xml` | Oui (articles, quizz, pages, catégories, tags, auteurs) |
| `/robots.txt` | Oui |
| `/rss.xml` | Oui (20 derniers articles, configurable) |
| `/go/[slug]` | Redirection 302 + nofollow sponsored vers lien affilié |

---

## 12. Points de sécurité

- Interface admin protégée par rôle — vérification dans les Server Components / Server Actions / Route Handlers via `auth()`
- ⚠️ Next 16 : `proxy.ts` (ex-`middleware.ts`) sert à la redirection précoce mais **n'est pas une frontière de sécurité** — ne jamais s'y reposer seul pour protéger les routes/données
- Rester sur Next **16.2.6+** (13 CVE corrigées en mai 2026)
- Mots de passe hashés (bcrypt)
- Sessions stockées en BDD via Next-Auth (permet révocation)
- Liens d'invitation : token unique + expiration 24h + usage unique
- Redémarrage Docker via Socket Proxy filtré (commande `restart` uniquement sur le container `app`)
- Inputs touchant aux emails (SMTP, newsletter) assainis et validés (Zod) pour éviter les injections CRLF/SMTP

---

## 13. Variables d'environnement requises (minimales)

Ces trois variables **doivent** rester dans le `.env` — elles sont nécessaires au démarrage avant que la BDD soit accessible :

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Toutes les autres configurations (Google OAuth, SMTP, Analytics, AdSense...) sont **stockées en BDD** et éditables depuis l'admin panel.

---

## 14. Ce qui est volontairement exclu (v1)

- Multilingue complet
- Recherche avancée (Algolia, Meilisearch)
- Système de membership payant (Stripe)
- CDN externe
- Notification push

---

## 15. Ordre de développement recommandé

1. **Phase 1** — Structure du projet, schéma Prisma, Docker Compose (app + db + caddy + socket-proxy)
2. **Phase 2** — Auth (Next-Auth, email+password, Google OAuth), rôles, invitations
3. **Phase 3** — Frontend public (landing, article, tag, catégorie, auteur, recherche, 404, RSS, sitemap)
4. **Phase 4** — Admin de base (articles, tags, catégories, slugs, redirections, settings BDD)
5. **Phase 5** — Quizz (éditeur admin + pages publiques + structured data)
6. **Phase 6** — Utilisateurs (mon compte, favoris, commentaires, likes, notifications)
7. **Phase 7** — SEO avancé (JSON-LD complet, OG images, hreflang, ISR configurable)
8. **Phase 8** — Newsletter, analytics, AdSense, RGPD, cookies
9. **Phase 9** — Affiliation (produits, /go/, /produits, disclosure)
10. **Phase 10** — Apparence (thème, mode sombre, favicon, footer, pages légales)
11. **Phase 11** — Gamification (points, niveaux, badges, activation/désactivation)
12. **Phase 12** — Polish (tableau de bord, logs, import WordPress, prévisualisation, historique versions)
