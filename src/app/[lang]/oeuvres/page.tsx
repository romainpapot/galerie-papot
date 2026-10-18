import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogue } from "@/components/Catalogue";
import { themeName, toCard } from "@/lib/artworks";
import { alternates } from "@/lib/i18n";
import { getTranslations } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getTranslations();
  return {
    title: t.catalogue.title,
    description: t.catalogue.description,
    alternates: alternates(lang, "/oeuvres"),
  };
}

const STATUS_ORDER = { DISPONIBLE: 0, RESERVE: 1, VENDU: 2 } as const;

export default async function OeuvresPage() {
  const { lang, t } = await getTranslations();
  const [artworks, themes, artists] = await Promise.all([
    prisma.artwork.findMany({ include: { theme: true, artist: true }, orderBy: { createdAt: "desc" } }),
    prisma.theme.findMany({ where: { artworks: { some: {} } } }),
    prisma.artist.findMany({ where: { artworks: { some: {} } }, select: { name: true, slug: true } }),
  ]);

  // Les œuvres vendues restent visibles (archive) mais passent en fin de liste
  const cards = artworks
    .map((a) => toCard(a, lang))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const filters = themes
    .map((th) => ({ name: themeName(th, lang), slug: th.slug }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));
  artists.sort((a, b) => a.name.localeCompare(b.name, lang));

  return (
    <div className="container-page pt-10 md:pt-16">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-5xl md:text-6xl">{t.catalogue.title}</h1>
        <p className="mt-4 text-muted">{t.catalogue.intro}</p>
      </header>
      <Suspense>
        <Catalogue artworks={cards} themes={filters} artists={artists} lang={lang} />
      </Suspense>
    </div>
  );
}
