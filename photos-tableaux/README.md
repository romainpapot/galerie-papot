# Photos des tableaux

Dossier de travail pour préparer les photos des œuvres avant leur ajout au site.

- `a-traiter/` : déposer ici les photos brutes (JPEG, PNG, WebP, TIFF), telles qu'elles
  sortent de l'appareil ou du téléphone.
- `traitees/` : photos retravaillées, prêtes à être importées depuis le back-office (`/admin`).

## Traitement

```bash
npm run photos:encadrer              # toutes les photos de a-traiter/
npm run photos:encadrer -- IMG_1.jpg # une photo précise
```

Chaque photo est :

1. orientée (EXIF), puis recadrée et redressée selon `reglages.json` si besoin ;
2. harmonisée : légère correction de la dominante de couleur de l'éclairage, étirement
   des niveaux et luminosité moyenne rapprochée d'une même cible, sans dénaturer
   les teintes du tableau ;
3. entourée d'un cadre noir puis d'une marge blanche, et enregistrée en JPEG
   (2400 px maximum pour le tableau).

Réglages facultatifs par photo dans `reglages.json` (voir l'en-tête de
`scripts/encadrer-tableaux.ts`) : `recadrage`, `rotation`, `luminosite`, `balanceBlancs`.

Les images elles-mêmes ne sont pas versionnées dans git.
