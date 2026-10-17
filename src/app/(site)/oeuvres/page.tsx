import type { Metadata } from "next";
import { Suspense } from "react";
import { Catalogue } from "@/components/Catalogue";
import { toCard } from "@/lib/artworks";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Œuvres",
  description: "Catalogue des peintures de la Galerie Papot, filtrables par thème.",
};

const STATUS_ORDER = { DISPONIBLE: 0, RESERVE: 1, VENDU: 2 } as const;

export default async function OeuvresPage() {
  const [artworks, themes] = await Promise.all([
    prisma.artwork.findMany({ include: { theme: true }, orderBy: { createdAt: "desc" } }),
    prisma.theme.findMany({ orderBy: { name: "asc" }, where: { artworks: { some: {} } } }),
  ]);

  // Les œuvres vendues restent visibles (archive) mais passent en fin de liste
  const cards = artworks
    .map(toCard)
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return (
    <div className="container-page pt-10 md:pt-16">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-serif text-5xl md:text-6xl">Œuvres</h1>
        <p className="mt-4 text-muted">
          L&apos;ensemble du travail de l&apos;atelier. Les œuvres vendues sont conservées ici en archive.
        </p>
      </header>
      <Suspense>
        <Catalogue artworks={cards} themes={themes.map((t) => ({ name: t.name, slug: t.slug }))} />
      </Suspense>
    </div>
  );
}
