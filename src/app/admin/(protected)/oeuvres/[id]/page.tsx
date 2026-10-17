import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { artworkReference } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";
import { updateArtwork } from "../../../actions";

export const metadata = { title: "Modifier une œuvre" };

export default async function EditArtwork(props: PageProps<"/admin/oeuvres/[id]">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [artwork, themes] = await Promise.all([
    prisma.artwork.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    prisma.theme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!artwork) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-serif text-4xl">
          {artwork.title} <span className="font-sans text-base text-muted">{artworkReference(artwork.id)}</span>
        </h1>
        <Link href={`/oeuvres/${artwork.slug}`} target="_blank" className="text-sm text-muted hover:text-ink">
          Voir sur le site ↗
        </Link>
      </div>
      <ArtworkForm
        action={updateArtwork.bind(null, artwork.id)}
        themes={themes}
        initial={{
          ...artwork,
          status: toStatus(artwork.status),
          images: artwork.images.map(({ id, url }) => ({ id, url })),
        }}
      />
    </div>
  );
}
