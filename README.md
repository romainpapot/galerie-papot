# Galerie Papot

Site vitrine et galerie d'art en ligne, en français et en anglais : catalogue
filtrable par thème et par artiste, fiches œuvres avec statut (Disponible / Réservé / Vendu),
formulaire de contact relié à l'œuvre avec notification email, et back-office
pour le galeriste.

**Stack** : Next.js 16 (App Router) · Tailwind CSS 4 · Prisma 6 + SQLite ·
images stockées localement (redimensionnées en WebP par `sharp`).

## Démarrer

Prérequis : Node.js 20.9 ou plus récent.

```bash
cp .env.example .env      # puis personnaliser SESSION_SECRET, ADMIN_PASSWORD…
npm install
npm run setup             # crée la base SQLite + données de démonstration
npm run dev               # http://localhost:3000
```

Back-office : <http://localhost:3000/admin> avec `ADMIN_USERNAME` / `ADMIN_PASSWORD`
du fichier `.env` (par défaut `galerie` / `changez-ce-mot-de-passe`).

⚠️ `npm run db:seed` **réinitialise** œuvres, thèmes et demandes. Pour changer
uniquement le mot de passe admin, modifiez `ADMIN_PASSWORD` puis relancez le seed
sur une base vide, ou mettez à jour la table `admin_users` via `npm run db:studio`.

## Production

```bash
npm run build
npm start
```

- `SITE_URL` en `https://…` : le cookie de session devient « secure ».
- `UPLOAD_DIR` doit pointer vers un dossier persistant (les images envoyées y sont
  écrites et servies par la route `/uploads/…`). Idem pour le fichier SQLite.
- Emails : renseigner `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
  `SMTP_FROM` et `GALLERY_EMAIL`. Sans SMTP, les notifications sont affichées dans
  la console du serveur et les demandes restent consultables dans le back-office.
- Hébergement serverless (Vercel…) : le disque n'y est pas persistant ; il faudra
  passer à PostgreSQL (changer `provider` dans `prisma/schema.prisma`) et à un
  stockage objet pour les images (Supabase Storage, S3…).

## Organisation

```
prisma/schema.prisma      Modèle de données (Artwork, ArtworkImage, Artist, Theme, ListOption, Inquiry, PageView, AdminUser)
prisma/seed.ts            Données de démonstration (visuels abstraits générés)
src/app/[lang]/           Front-office (FR et EN) : accueil, /oeuvres, /oeuvres/[slug], /contact
src/proxy.ts              Choix de la langue : /… en français, /en/… en anglais
src/app/admin/            Back-office : connexion, tableau de bord, statistiques, œuvres, artistes,
                          thèmes, listes, demandes
src/app/admin/actions.ts  Actions serveur du back-office (toutes protégées par requireAdmin)
src/app/uploads/          Service des images envoyées
src/components/           ArtworkCard, StatusBadge, ArtworkAction (bouton selon statut)…
src/lib/                  Prisma, session (JWT en cookie httpOnly), images, email, statuts,
                          langues (i18n.ts) et textes de l'interface (dictionaries.ts)
```

## Français / English

Le site public existe en deux langues : le français aux adresses habituelles
(`/oeuvres/…`), l'anglais sous `/en` (`/en/oeuvres/…`). Un sélecteur FR / EN est
dans l'en-tête et le choix est mémorisé (cookie `lang`). À la première visite, un
navigateur réglé dans une autre langue que le français est dirigé vers l'anglais.
Chaque page indique à Google sa version dans l'autre langue (balises `hreflang`).

- Textes fixes (menus, boutons, statuts, formulaire) : `src/lib/dictionaries.ts`.
- Contenus du catalogue : dans le back-office, chaque œuvre a une section
  « Version anglaise » (titre, note d'intention), chaque thème un nom anglais, et
  chaque type de peinture et support un nom anglais dans « Listes ». Tout est facultatif : un champ vide affiche le texte français.
- Les demandes envoyées depuis le site anglais portent la mention `EN` dans le
  back-office et `[EN]` dans l'objet de l'email.
- Le back-office reste en français.

## Artistes et listes

La galerie expose plusieurs artistes : la page « Artistes » du back-office les
gère (nom, adresse du filtre `/oeuvres?artiste=…`). Le nom figure sur la fiche de
l'œuvre (« par … ») et le catalogue propose un filtre par artiste dès qu'un artiste
a au moins une œuvre.

Le type de peinture, le support et les dimensions se choisissent dans des listes
déroulantes, pour un nommage identique d'une œuvre à l'autre. Les valeurs se gèrent
dans « Listes » (avec leur traduction anglaise) ; renommer une valeur met à jour
toutes les œuvres qui l'utilisent, et une valeur utilisée ne peut pas être supprimée.
Les dimensions saisies sont mises en forme automatiquement (`80x100` → `80 × 100 cm`).

Mise à jour d'une base existante (anciens champs en texte libre) :

```bash
npx prisma db push          # ajoute les tables artists et list_options
npm run db:migrer-listes    # crée les valeurs à partir des œuvres et les relie (relançable)
```

## Statistiques de visite

Le back-office (`/admin/statistiques`) affiche visites, pages vues, temps passé,
rebond, taux de demandes, vues par œuvre, provenance, thèmes, appareils et heures
d'affluence, sur 7 jours, 30 jours, 3 mois ou 12 mois.

La mesure est interne et **sans cookie** : le composant `Tracker` envoie chaque
page vue à `/api/track`, le visiteur est identifié par une empreinte anonyme
(IP + navigateur hachés avec un sel renouvelé chaque jour, l'IP n'est jamais
stockée). Les robots, les navigateurs « Do Not Track / GPC » et l'administrateur
connecté ne sont pas comptés ; les données sont purgées après 13 mois. Pour suivre
une campagne, ajoutez `?utm_source=newsletter` (par exemple) aux liens partagés.

Après une mise à jour du code : `npx prisma db push` pour mettre la base à jour
(table `page_views`, champs anglais), puis redémarrer le serveur. Les pages vues en
anglais apparaissent avec la mention « (EN) ».

## Règles d'affichage des statuts

| Statut | Carte / fiche | Bouton de contact |
|---|---|---|
| `DISPONIBLE` | Badge vert | « Se positionner / Contacter la galerie » → formulaire pré-rempli avec la référence |
| `RESERVE` | Badge ambre « Réservé » | Bouton grisé « Actuellement réservé » + lien liste d'attente |
| `VENDU` | Badge « Vendu », visuel légèrement grisé, placé en fin de catalogue | « Œuvre vendue » + demande de réédition / œuvre similaire |

Le statut et l'indicateur « Nouveauté » se changent en un clic depuis la liste
des œuvres du back-office ; le site public est mis à jour immédiatement.
