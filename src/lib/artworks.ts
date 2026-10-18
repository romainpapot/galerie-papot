import type { Artist, Artwork, ArtworkImage, ListOption, Theme } from "@prisma/client";
import { pick, type Locale } from "./i18n";
import { toStatus, type ArtworkStatus } from "./status";

/** Relations à charger pour afficher une fiche œuvre complète. */
export const artworkDetails = { theme: true, artist: true, medium: true, support: true, dimensions: true } as const;

/** Données sérialisables d'une œuvre, utilisables côté client. */
export type ArtworkCardData = {
  id: number;
  slug: string;
  title: string;
  price: number | null;
  imageUrl: string;
  status: ArtworkStatus;
  isNew: boolean;
  theme: { name: string; slug: string } | null;
  artistSlug: string | null;
};

export function toCard(a: Artwork & { theme: Theme | null; artist?: Artist | null }, lang: Locale): ArtworkCardData {
  return {
    id: a.id,
    slug: a.slug,
    title: pick(lang, a.title, a.titleEn),
    price: a.price,
    imageUrl: a.imageUrl,
    status: toStatus(a.status),
    isNew: a.isNew,
    theme: a.theme ? { name: themeName(a.theme, lang), slug: a.theme.slug } : null,
    artistSlug: a.artist?.slug ?? null,
  };
}

/** Textes d'une œuvre dans la langue demandée (repli sur le français pour les champs non traduits). */
export function localizeArtwork(
  a: Artwork & { medium?: ListOption | null; support?: ListOption | null; dimensions?: ListOption | null },
  lang: Locale,
) {
  return {
    title: pick(lang, a.title, a.titleEn),
    description: pick(lang, a.description, a.descriptionEn),
    medium: a.medium ? optionName(a.medium, lang) : "",
    support: a.support ? optionName(a.support, lang) : "",
    dimensions: a.dimensions ? optionName(a.dimensions, lang) : "",
  };
}

export function themeName(theme: Theme, lang: Locale) {
  return pick(lang, theme.name, theme.nameEn);
}

export function optionName(option: ListOption, lang: Locale) {
  return pick(lang, option.name, option.nameEn);
}

export function allImages(a: Artwork & { images: ArtworkImage[] }) {
  return [a.imageUrl, ...a.images.sort((x, y) => x.position - y.position).map((i) => i.url)].filter(Boolean);
}
