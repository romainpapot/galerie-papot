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

1. orientée (EXIF), puis la toile est repérée automatiquement sur le mur (ses 4 coins)
   et redressée : la perspective d'une photo prise un peu de biais est corrigée ;
2. harmonisée en prenant le mur blanc autour du tableau comme référence : il est rendu
   neutre et amené à la même luminosité sur toutes les photos. L'éclairage devient
   uniforme sans dénaturer les œuvres (un tableau sombre reste sombre) ;
3. entourée d'un cadre noir puis d'une marge blanche, et enregistrée en JPEG
   (2400 px maximum pour le tableau).

Les coins détectés sont enregistrés dans `reglages.json`, et `apercus/` montre chaque
photo d'origine avec le contour retenu (en magenta). Si un contour est faux, corriger
les coins dans `reglages.json` puis relancer.

Pour de bons résultats : photographier de face, avec du mur visible tout autour du
tableau, à la lumière du jour indirecte et sans flash.

Autres réglages facultatifs par photo (voir l'en-tête de `scripts/encadrer-tableaux.ts`) :
`recadrage` (à la place des coins), `rotation`, `luminosite`, `balanceBlancs`.

Les images elles-mêmes ne sont pas versionnées dans git.
