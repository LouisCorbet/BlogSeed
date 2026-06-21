# BlogSeed — Feuille de route incrémentale

Chaque tranche est verticale : elle va de la base de données jusqu'à l'écran, elle est testable seule, et elle se termine par quelque chose de concret et fonctionnel. On ne passe à la tranche suivante que quand la précédente est terminée et comprise.

---

## BLOC 1 — Fondations

### Tranche 1 — Hello World + infrastructure complète
- Projet Next.js initialisé (App Router, Turbopack, TypeScript)
- Page d'accueil `/` affichant "Hello World"
- Docker Compose avec les 4 containers : `app`, `db` (PostgreSQL), `caddy`, `socket-proxy`
- Caddy configuré : HTTPS automatique, reverse proxy vers `app`
- Base de données PostgreSQL démarrée avec un volume persistant
- Schéma Prisma minimal (juste la connexion qui marche), migration initiale appliquée
- Variables d'environnement minimales en place (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`)
- ✅ Résultat : le site s'affiche en HTTPS sur le domaine configuré

### Tranche 2 — Authentification email/mot de passe + rôles
- Modèles Prisma : `User`, `Account`, `Session`, `VerificationToken` (requis par Next-Auth v5)
- Champ `roles` sur `User` (tableau, cumulable) — valeurs : `READER`, `AUTHOR`, `EDITOR`, `ADMIN`
- Pages : `/register`, `/login`, `/logout`
- Inscription par email + mot de passe (bcrypt)
- Connexion par email + mot de passe
- Session stockée en BDD via Next-Auth
- Les rôles sont gérés uniquement en back — aucun choix de rôle côté utilisateur à l'inscription
- Rôle par défaut à l'inscription : `READER`
- ✅ Résultat : on peut créer un compte, se connecter, se déconnecter

### Tranche 3 — Authentification Google OAuth
- Configuration Google OAuth dans Next-Auth v5
- Client ID et Client Secret en variables d'environnement (ils iront en BDD plus tard, dans la tranche config admin)
- Bouton "Continuer avec Google" sur les pages login et register
- Fusion de compte si l'email Google correspond à un compte email/mdp existant
- ✅ Résultat : on peut se connecter avec Google

### Tranche 4 — Page "Mon compte" (version initiale)
- Route `/mon-compte` protégée (redirige vers `/login` si non connecté)
- Affichage des infos : nom, email, rôles
- Formulaire de changement de mot de passe
- Formulaire de changement d'email
- Bouton "Se déconnecter de toutes les sessions"
- ✅ Résultat : un utilisateur connecté peut gérer ses identifiants

### Tranche 5 — Admin panel (structure) + gestion des utilisateurs
- Route `/admin` protégée par rôle `ADMIN` (vérification en Server Component via `auth()`)
- Layout admin minimal : sidebar avec navigation
- Page `/admin/utilisateurs` :
  - Liste de tous les comptes (nom, email, rôles, date d'inscription)
  - Suppression de compte
  - Modification des rôles d'un utilisateur
  - Génération d'un lien d'invitation (choix du rôle, token unique, expiration 24h, usage unique)
  - Fonctionnalité "Log as" (se connecter en tant qu'un autre utilisateur)
  - Bouton "Envoyer une demande de réinitialisation de mot de passe" (prépare le terrain pour le SMTP — envoie un lien par email)
- ⚠️ Note : la fonctionnalité "demande de réinitialisation" nécessite une config SMTP — elle sera activée pleinement à la tranche SMTP (Bloc 4)
- ✅ Résultat : un Admin peut gérer tous les comptes depuis l'interface

### Tranche 6 — Acceptation d'invitation
- Page publique `/invitation/[token]`
- Vérification du token (existence, non expiré, non utilisé)
- Formulaire de création de compte avec rôle pré-assigné
- Marquage du token comme utilisé après inscription
- ✅ Résultat : le flux d'invitation complet fonctionne de bout en bout

---

> 💡 **Checkpoint** : à ce stade, on dispose d'une application d'authentification complète et autonome, réutilisable comme base pour d'autres projets.

---

## BLOC 2 — Configuration & contenu de base

### Tranche 7 — Config du site (admin panel)
- Modèle Prisma `SiteConfig` (titre du blog, description, favicon, couleur primaire, couleur secondaire, border-radius, police Google Fonts, couleurs mode sombre)
- Page `/admin/configuration` :
  - Champs titre, description
  - Upload favicon
  - Personnalisation des couleurs, typo, border-radius
  - Contenu personnalisable de la page 404 (titre, message, lien)
  - Configuration Google OAuth (Client ID + Client Secret) — stockés en BDD, redémarrage automatique du container `app` via Socket Proxy à la sauvegarde
- Page 404 publique (`not-found.tsx`) — hérite du style global du site (couleurs, typo, variables CSS), pas de contenu personnalisable
- Variables CSS générées dynamiquement et appliquées globalement via le layout racine
- ✅ Résultat : le titre, le style, la 404 et l'OAuth sont configurables depuis l'admin

### Tranche 8 — CRUD Catégories (admin panel)
- Modèle Prisma `Category` (nom, slug, description)
- Page `/admin/categories` : liste, création, édition, suppression
- Slug auto-généré depuis le nom, modifiable manuellement
- ✅ Résultat : les catégories existent en base et sont gérables

### Tranche 9 — CRUD Tags (admin panel)
- Modèle Prisma `Tag` (nom, slug)
- Page `/admin/tags` : liste, création, édition, suppression
- ✅ Résultat : les tags existent en base et sont gérables

### Tranche 10 — CRUD Articles (liste admin)
- Modèle Prisma `Post` (titre, slug, contenu, statut, auteur, catégorie, tags, dates, featured, épinglé, FAQ, coverImage, readingTime, ISR delay...)
- Page `/admin/articles` : liste des articles avec statut (brouillon, soumis, planifié, publié)
- Boutons : créer, éditer, supprimer, changer le statut
- File de validation : articles soumis par les Auteurs, validables par Éditeur/Admin
- ✅ Résultat : la liste des articles est gérée depuis l'admin (les articles sont encore vides)

### Tranche 11 — Éditeur d'article
- Page `/admin/articles/[id]/editer` :
  - Toggle rich text (TipTap) / HTML brut
  - Sauvegarde automatique du brouillon toutes les X secondes
  - Slug (auto-généré + modifiable)
  - **Redirection 301 automatique** créée en base si le slug est modifié (l'ancien slug redirige vers le nouveau)
  - Image de couverture (upload direct, Sharp génère WebP + thumbnail, dimensions stockées)
  - Catégorie (select)
  - Tags (multi-select)
  - FAQ (liste de questions/réponses)
  - Programmation de la date de publication
  - Marquer comme "featured" ou "épinglé"
  - Délai de revalidation ISR
  - SEO : meta title, meta description, OG image
  - Prévisualisation avant publication
- ✅ Résultat : on peut rédiger un article complet avec toutes ses métadonnées, et les changements de slug ne cassent pas les liens existants

### Tranche 12 — Page publique article
- Route `/article/[slug]`
- Affichage du contenu de l'article
- Image de couverture
- Temps de lecture estimé
- Barre de progression de lecture (scroll)
- Table des matières automatique (H2/H3)
- Fil d'Ariane (breadcrumb)
- Tags et catégorie cliquables
- Auteur avec lien vers sa page
- Articles liés (même catégorie/tags)
- Section FAQ (si renseignée)
- Compteur de vues (stocké en base, sans cookie)
- Métadonnées SEO dynamiques (`generateMetadata`)
- JSON-LD : `Article`, `BreadcrumbList`, `Person`
- ✅ Résultat : un article est lisible publiquement avec SEO complet

### Tranche 13 — Landing page (style Netflix)
- Page `/` affiche les articles publiés
- Sections : Hero (article épinglé ou plus récent), Les plus récents, Sélection de l'éditeur, Par catégorie
- Pagination sur les listes
- Configuration des sections depuis `/admin/landing` (ordre, visibilité, nombre d'articles)
- Infos générales du blog (titre, description, liens sociaux) depuis la config
- ✅ Résultat : la landing page est vivante avec de vrais articles

### Tranche 14 — Sitemap dynamique
- `/sitemap.xml` généré dynamiquement (articles, catégories, tags, auteurs)
- `/robots.txt` généré dynamiquement
- ✅ Résultat : le site est indexable par Google

### Tranche 15 — Pages auteur
- Route `/auteur/[slug]`
- Bio de l'auteur, avatar (initiales par défaut)
- Liste paginée de ses articles publiés
- Ajout d'une section "Articles par auteur" sur la landing page
- JSON-LD : `Person`
- ✅ Résultat : chaque auteur a sa page publique

---

## BLOC 3 — Affiliation & interactions sociales

### Tranche 16 — Pages /tag/[slug] et /categorie/[slug]
- Route `/tag/[slug]` : liste paginée des articles associés au tag
- Route `/categorie/[slug]` : liste paginée des articles de la catégorie
- Métadonnées SEO dynamiques sur chaque page (`generateMetadata`)
- Ces pages sont déjà liées depuis les articles (tags et catégorie cliquables — Tranche 12)
- ✅ Résultat : la navigation par tag et catégorie est pleinement fonctionnelle

### Tranche 17 — Barre de recherche globale
- Page `/recherche` : résultats par mots-clés (SQL LIKE sur titre + contenu)
- Filtres : catégorie, tag, auteur, date
- Résultats mélangés articles + quizz (avec indicateur de type)
- Barre de recherche accessible depuis le header (toutes les pages)
- ✅ Résultat : les visiteurs peuvent trouver du contenu sans naviguer manuellement

### Tranche 18 — Produits affiliés (admin + pages publiques)
- Modèle Prisma `AffiliateProduct` (nom, description, image, lien, slug CTA)
- Page `/admin/produits-affilies` : CRUD des produits
- Association produits ↔ articles depuis l'éditeur d'article
- Bloc produit affilié insérable dans le contenu (image, nom, description, bouton CTA)
- Encart "disclosure affiliation" automatique si l'article contient des produits affiliés
- Route `/go/[slug]` : redirection 302 + `rel="nofollow sponsored"` + tracking du clic en base
- Page publique `/produits` : catalogue avec filtres par catégorie, structured data `Product`
- Stats de clics par produit visibles en admin
- ✅ Résultat : le système d'affiliation est complet de bout en bout

### Tranche 19 — Commentaires
- Modèle Prisma `Comment` (contenu, auteur, article, parent pour les réponses, dates)
- Section commentaires en bas de chaque article (lazy-loaded au scroll)
- Réponses à 1 niveau de profondeur
- Commentaires réservés aux utilisateurs connectés
- Suppression visible uniquement pour les Admin (depuis le front et depuis l'admin panel)
- ✅ Résultat : les lecteurs connectés peuvent commenter et répondre

### Tranche 20 — Historique des commentaires dans "Mon compte"
- Section "Mes commentaires" dans `/mon-compte`
- Liste chronologique avec lien vers l'article concerné
- ✅ Résultat : un utilisateur retrouve tous ses commentaires depuis son profil

### Tranche 21 — Partage social
- Boutons de partage sur chaque article : Twitter/X, LinkedIn, copie du lien
- ✅ Résultat : les articles sont partageables en un clic

### Tranche 22 — Likes sur les articles
- Modèle Prisma `Like` (utilisateur + article)
- Bouton like sur chaque article (utilisateurs connectés)
- Compteur de likes affiché publiquement
- Section "Les plus likés" ajoutée sur la landing page
- ✅ Résultat : les articles peuvent être likés

### Tranche 23 — Likes et réponses sur les commentaires
- Like sur les commentaires (utilisateurs connectés)
- Compteur de likes sur chaque commentaire
- ✅ Résultat : les commentaires peuvent être likés

### Tranche 24 — "Mes likes" dans "Mon compte"
- Section "Mes likes" dans `/mon-compte` : articles likés + commentaires likés
- ✅ Résultat : un utilisateur retrouve tout ce qu'il a liké

---

## BLOC 4 — Gamification & profil enrichi

### Tranche 25 — Système de points
- Modèle Prisma `PointEvent` (utilisateur, action, points, date)
- Attribution automatique de points selon les actions :
  - Création de compte (+10), commentaire (+5), réponse reçue (+2), like reçu sur commentaire (+1), like d'article (+1)
- Total de points calculé par utilisateur
- ✅ Résultat : les points sont attribués silencieusement en arrière-plan

### Tranche 26 — Config gamification (admin panel)
- Page `/admin/gamification` :
  - Activation / désactivation globale
  - Configuration des points par action (modifiables)
  - Configuration des niveaux (nom, seuil de points)
- Si désactivé : aucun badge, aucun point, aucune mention nulle part dans l'interface
- Badge de niveau affiché sur le profil et à côté du nom dans les commentaires (si activé)
- ✅ Résultat : la gamification est activable/désactivable sans toucher au code

### Tranche 27 — Avatar et nom dans "Mon compte"
- Upload d'avatar depuis `/mon-compte` (Sharp, WebP)
- Avatar par défaut : initiales dans un cercle coloré
- Modification du nom affiché
- ✅ Résultat : le profil utilisateur est personnalisable

---

## BLOC 5 — Quizz

### Tranche 28 — CRUD Quizz (admin panel)
- Modèle Prisma `Quiz`, `QuizQuestion`, `QuizAnswer`, `QuizProfile`, `QuizResult`
- Page `/admin/quizz` : liste des quizz avec statut
- File de validation : quizz soumis par les Auteurs, validables par Éditeur/Admin
- ✅ Résultat : les quizz existent en base et sont listés dans l'admin

### Tranche 29 — Éditeur de quizz
- Page `/admin/quizz/[id]/editer` :
  - Titre, slug, description, image de couverture
  - Création des profils résultats (nom, description, image)
  - Création des questions (texte + image optionnelle)
  - Pour chaque réponse : association à un ou plusieurs profils + poids
  - Mode d'affichage : questions une par une ou toutes à la suite
  - Catégorie, tags
  - Programmation de la date de publication
  - Sauvegarde automatique du brouillon
  - Prévisualisation
- ✅ Résultat : on peut créer un quizz complet depuis l'admin

### Tranche 30 — Page publique quizz
- Route `/quiz/[slug]`
- Présentation du quizz (titre, description, image)
- Questions affichées selon le mode configuré
- Calcul du profil résultat à la fin
- Boutons de partage social sur la page de résultat
- Résultat sauvegardé sur le profil si connecté
- Si gamification activée : points attribués à la complétion
- JSON-LD : `Quiz`
- ✅ Résultat : un quizz est jouable publiquement

### Tranche 31 — Quizz dans la landing page
- Section "Quizz récents / populaires" ajoutée sur la landing page (configurable depuis l'admin)
- Page `/quiz` : liste paginée de tous les quizz publiés, filtres par catégorie/tag
- ✅ Résultat : les quizz sont visibles et accessibles depuis la landing

### Tranche 32 — Inscription requise pour les quizz
- Prompt d'inscription/connexion avant de remplir un quizz (si non connecté)
- ✅ Résultat : les résultats sont toujours associés à un compte

### Tranche 33 — Résultats de quizz dans "Mon compte"
- Section "Mes résultats aux quizz" dans `/mon-compte`
- Historique des quizz complétés avec le profil obtenu
- ✅ Résultat : l'historique des quizz est visible sur le profil

### Tranche 34 — Quizz dans le sitemap
- `/sitemap.xml` mis à jour pour inclure les quizz
- ✅ Résultat : les quizz sont indexables

---

## BLOC 6 — Newsletter, SMTP & notifications

### Tranche 35 — Configuration SMTP
- Modèle Prisma `SmtpConfig` (host, port, user, password, from) — stocké en BDD
- Page `/admin/smtp` : formulaire de config + bouton "Envoyer un email de test"
- Activation de la réinitialisation de mot de passe (tranche 5)
- Activation des notifications email (tranche suivante)
- ✅ Résultat : le serveur peut envoyer des emails

### Tranche 36 — Notifications email
- Email envoyé à un utilisateur quand quelqu'un répond à son commentaire
- ✅ Résultat : les notifications de réponses fonctionnent

### Tranche 37 — Newsletter
- Modèle Prisma `NewsletterSubscriber` (email, date d'inscription)
- Formulaire d'inscription à la newsletter (page publique + footer)
- Page `/admin/newsletter` :
  - Liste des abonnés + export CSV
  - Template de l'email d'envoi (rich text, variables : titre, extrait, lien, image)
  - Envoi automatique à chaque publication d'article
- ✅ Résultat : la newsletter fonctionne de bout en bout

---

## BLOC 7 — Analytics, monétisation & RGPD

### Tranche 38 — RGPD & bandeau cookies
- Page `/admin/rgpd` : activation/désactivation du bandeau, personnalisation du texte
- Bandeau de consentement cookies sur le front
- Préférences stockées dans un cookie local
- Modifiable depuis "Mon compte" pour les utilisateurs connectés
- GA, Plausible et AdSense ne se chargent que si l'utilisateur a accepté
- ✅ Résultat : le consentement est géré avant d'activer les outils tiers

### Tranche 39 — Google Analytics
- Page `/admin/analytics` : case à cocher activation/désactivation + champ ID de tag Google
- Stocké en BDD, redémarrage automatique du container via Socket Proxy à la sauvegarde
- Chargement conditionné au consentement cookies
- ✅ Résultat : GA est activable/désactivable sans toucher au code

### Tranche 40 — AdSense
- Page `/admin/adsense` : activation/désactivation par emplacement (avant article, après article, sidebar...) + ID client + ID bloc
- Balise `<script>` AdSense injectée conditionnellement (consentement requis)
- ✅ Résultat : les emplacements publicitaires sont gérables depuis l'admin

---

## BLOC 8 — Polish & observabilité

### Tranche 41 — Logs d'activité
- Modèle Prisma `ActivityLog` (acteur, action, cible, date)
- Événements loggés automatiquement : article publié, commentaire supprimé, utilisateur invité, quizz validé, rôle modifié, etc.
- Page `/admin/logs` : historique chronologique filtrable, visible par les Admin uniquement
- ✅ Résultat : les Admins ont une traçabilité complète des actions importantes

---

## À venir (non planifié pour l'instant)

Ces fonctionnalités figurent dans les specs mais ne sont pas encore planifiées dans la feuille de route :

- Plausible Analytics
- Redirections 301 manuelles (admin)
- Pages légales (mentions légales, CGU, politique de confidentialité) — éditables en rich text
- Historique des versions d'articles
- Import WordPress (XML)
- RSS feed
