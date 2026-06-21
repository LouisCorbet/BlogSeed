# Phase 3 — Frontend public

Pages publiques + fichiers techniques SEO. À fusionner par-dessus le projet
issu des Phases 1 et 2.

## Contenu livré

**Pages** (groupe de routes `(public)` avec layout commun header/footer + thème)
- `(public)/page.tsx` — landing style Netflix (Hero + sections configurables)
- `(public)/article/[slug]/page.tsx` — page article complète
- `(public)/categorie/[slug]/page.tsx` — liste paginée par catégorie
- `(public)/tag/[slug]/page.tsx` — liste paginée par tag
- `(public)/auteur/[slug]/page.tsx` — bio + articles de l'auteur
- `(public)/recherche/page.tsx` — recherche multi-filtres (articles + quizz)
- `(public)/layout.tsx` — header, footer, injection des variables de thème

**Fichiers techniques**
- `not-found.tsx` — page 404 personnalisable depuis l'admin
- `sitemap.ts` — `/sitemap.xml` dynamique
- `robots.ts` — `/robots.txt` dynamique
- `rss.xml/route.ts` — flux RSS dynamique
- `article-content.css` — styles du contenu d'article rendu

**Composants**
- `components/article/` — carte, listes/rangées, barre de progression (client),
  table des matières (client), boutons de partage (client)
- `components/layout/` — header et footer publics
- `components/search/search-form.tsx` — formulaire de recherche (client)
- `components/breadcrumb.tsx` — fil d'Ariane + JSON-LD BreadcrumbList
- `components/pagination.tsx` — pagination par liens (SEO)

**Lib**
- `lib/queries.ts` — toutes les requêtes du frontend public
- `lib/content.ts` — sanitization HTML, temps de lecture, table des matières
- `lib/site-url.ts` — URL de base / liens absolus

## ⚠️ Actions à mener à l'intégration

### 1. Déplacer l'accueil
La landing est désormais `src/app/(public)/page.tsx`. **Supprime l'ancienne
`src/app/page.tsx`** (placeholder de Phase 1), sinon conflit de route sur `/`.

### 2. Ajouter une dépendance
```bash
npm install isomorphic-dompurify --legacy-peer-deps
```
Utilisée pour la sanitization serveur du HTML d'article (contenu pouvant
provenir de l'éditeur HTML brut). `--legacy-peer-deps` pour rester cohérent
avec l'install next-auth beta des phases précédentes.

### 3. Importer les styles du contenu d'article
Ajoute en haut de `src/app/globals.css` :
```css
@import "./article-content.css";
```
(ou copie le contenu du fichier dans `globals.css`.)

### 4. Vérifier la cohérence du layout racine
Le `src/app/layout.tsx` de Phase 1 enveloppe déjà tout dans `AuthProvider`.
Le layout `(public)/layout.tsx` ajouté ici se place **à l'intérieur** et gère
header/footer/thème. Rien à changer si ton layout racine est inchangé.

## Validation effectuée

- **Typecheck** : vert sur tout le code Phase 3 (JSX, imports, signatures,
  types Next, props, helpers).
- **Requêtes Prisma** : relues à la main contre `schema.prisma` (noms de
  champs, relations, `include`/`select`).
- ⚠️ **Non vérifiable ici** : le typecheck définitif des requêtes Prisma
  nécessite le client généré (`binaries.prisma.sh` est bloqué dans mon
  environnement, comme en Phases 1-2). **Lance `npx prisma generate` puis
  `npm run typecheck` chez toi** pour la validation finale.

## À tester au runtime

1. `npx prisma generate && npm run typecheck` — doit passer sans erreur.
2. Crée quelques articles publiés en base (ou via seed), avec catégorie,
   tags, image de couverture, et un auteur ayant un `slug`.
3. Vérifie :
   - `/` — Hero + rangées (récents, vus, likés, par catégorie)
   - `/article/[slug]` — TOC, barre de progression au scroll, breadcrumb,
     FAQ (si renseignée), tags, partage, articles liés
   - `/categorie/[slug]`, `/tag/[slug]`, `/auteur/[slug]` — listes + pagination
   - `/recherche?q=...` — résultats articles + quizz mélangés
   - `/sitemap.xml`, `/robots.txt`, `/rss.xml` — bien générés
   - une URL inexistante — page 404
4. Vérifie que `NEXTAUTH_URL` est correct : il sert de base aux URL absolues
   (canonical, OG, sitemap, RSS).

## Limites assumées (activées dans les phases suivantes)

- **Likes & commentaires** (page article) : emplacement inerte → **Phase 6**
- **JSON-LD Article complet, OG images dynamiques, hreflang, ISR par article**
  → **Phase 7** (ici : breadcrumb + Person de base seulement)
- **Bloc produit affilié complet & `/produits` & `/go/`** → **Phase 9**
  (ici : seul l'encart disclosure s'affiche si activé)
- **Pages `/quiz` et `/quiz/[slug]`** → **Phase 5** (les liens existent déjà
  dans le header et la recherche les remonte)
- **Apparence fine / mode sombre / sélection de police** → **Phase 10**
  (ici : variables de thème lues depuis l'admin si déjà configurées)

## Choix techniques notables

- **Filtre de publication centralisé** (`publishedArticleWhere`) : aucune page
  n'expose un brouillon ou un article planifié dans le futur.
- **Sanitization systématique** du HTML avant rendu (`dangerouslySetInnerHTML`
  uniquement sur du contenu passé par `sanitizeHtml`).
- **Pagination par liens** `?page=N` (pas d'infinite scroll) — choix SEO des specs.
- **Compteur de vues sans cookie** : incrément `viewCount` au rendu de l'article
  (fire-and-forget, n'échoue jamais le rendu).
- **Page de recherche en `noindex`** (bonne pratique : on n'indexe pas les
  pages de résultats internes).
