# Galerie Papot

Site vitrine et galerie d'art en ligne. Échanges en français ; le README décrit
l'installation et l'organisation du code.

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4, Prisma 6 + SQLite, TypeScript 5.9.
- Next.js 16 diffère de versions plus anciennes : la documentation à jour est dans
  `node_modules/next/dist/docs/` (à consulter avant d'utiliser une API).
- Node.js 20.9 minimum (exigé par Next 16 et sharp).

## Commandes

- `npm run setup` : crée la base SQLite et charge les données de démonstration
  (⚠️ `npm run db:seed` réinitialise œuvres, thèmes et demandes).
- `npm run dev` ; `npm run typecheck` ; `npm run build && npm start`.
- Back-office : `/admin`, identifiants `ADMIN_USERNAME` / `ADMIN_PASSWORD` du `.env`.

## Conventions

- Statut d'une œuvre stocké en texte (`DISPONIBLE`, `RESERVE`, `VENDU`), validé dans
  `src/lib/status.ts`. L'affichage conditionnel est dans `StatusBadge`,
  `ArtworkAction` (bouton de contact) et `ArtworkCard` (œuvre vendue grisée).
- Type de peinture, support et dimensions : listes gérées en back-office (table
  `list_options`, champ `kind` validé dans `src/lib/options.ts`), reliées à l'œuvre par
  `mediumId` / `supportId` / `dimensionsId`. Artiste : table `artists` (`artistId`, photo `photoUrl`, présentation `bio` / `bioEn`).
  Les champs `legacy…` d'`Artwork` sont les anciens textes libres, repris par
  `npm run db:migrer-listes` : ne plus les utiliser.
- Références lisibles `GP-0001` calculées depuis l'id (`src/lib/format.ts`).
- Images : converties en WebP par sharp (`src/lib/images.ts`), stockées dans
  `UPLOAD_DIR` et servies par `src/app/uploads/[...path]/route.ts` (pas `/public`,
  qui n'est pas servi pour les fichiers ajoutés après le build).
- Authentification : table `admin_users` (bcrypt) + JWT signé en cookie httpOnly
  (`src/lib/session.ts`). Toute action serveur du back-office commence par
  `await requireAdmin()` ; les pages admin protégées sont sous `src/app/admin/(protected)/`.
- Formulaires admin : soumis via `onSubmit` + `startTransition` pour éviter que
  React 19 vide le formulaire en cas d'erreur de validation.
- Statistiques : collecte sans cookie (`src/components/Tracker.tsx` → `src/app/api/track/route.ts`,
  helpers dans `src/lib/analytics.ts`), agrégation en mémoire dans `src/lib/stats.ts`.
- Après une modification du catalogue, appeler `revalidatePath("/", "layout")`.
- Site public bilingue : pages dans `src/app/[lang]/` (`fr` sans préfixe d'URL, `en` sous
  `/en`, aiguillage dans `src/proxy.ts`). Textes par défaut dans `src/lib/dictionaries.ts`
  (FR et EN, même forme, chaînes uniquement : variables `{n}` remplies par `fill()` /
  `plural()`, paragraphes séparés par une ligne vide). Tous sont modifiables en
  back-office (« Textes », table `site_texts`, `src/lib/site-texts.ts`) : un nouveau texte
  doit être décrit dans `src/app/admin/(protected)/textes/sections.ts`. Côté serveur
  `getTranslations()` (`src/lib/locale.ts`), côté client `useDictionary()`
  (`DictionaryProvider`) ; ne pas lire `getDictionary()` sur le site (textes non modifiés). Liens internes via `localePath(lang, "/…")` (`src/lib/i18n.ts`).
- Contenus traduits en base : champs `…En` (œuvre) et `nameEn` (thème, valeur de liste),
  facultatifs, lus via `localizeArtwork` / `themeName` / `optionName` / `toCard(a, lang)`
  avec repli sur le français.
- Le back-office (`src/app/admin/`, layout racine propre) reste en français uniquement.
- Textes de l'interface en français, avec typographie française (« », espaces).
