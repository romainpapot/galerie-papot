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
- Textes de l'interface en français, avec typographie française (« », espaces).
