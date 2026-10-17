import type { Artwork, ArtworkImage, Theme } from "@prisma/client";
import { toStatus, type ArtworkStatus } from "./status";

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
};

export function toCard(a: Artwork & { theme: Theme | null }): ArtworkCardData {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    price: a.price,
    imageUrl: a.imageUrl,
    status: toStatus(a.status),
    isNew: a.isNew,
    theme: a.theme ? { name: a.theme.name, slug: a.theme.slug } : null,
  };
}

export function allImages(a: Artwork & { images: ArtworkImage[] }) {
  return [a.imageUrl, ...a.images.sort((x, y) => x.position - y.position).map((i) => i.url)].filter(Boolean);
}
