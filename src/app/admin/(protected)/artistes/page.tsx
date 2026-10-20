import { ArtistRow, NewArtistForm } from "@/components/admin/ArtistForms";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Artistes" };

export default async function AdminArtists() {
  const artists = await prisma.artist.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { artworks: true } } },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-serif text-4xl">Artistes</h1>
      <p className="text-sm text-muted">
        Artistes exposés par la galerie. Ils sont présentés sur la page d&apos;accueil (photo, nom et présentation) ;
        le nom apparaît aussi sur la fiche de l&apos;œuvre et le catalogue peut être filtré par artiste.
      </p>
      <NewArtistForm />
      {artists.length ? (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {artists.map((a) => (
            <ArtistRow
              key={`${a.id}-${a.name}-${a.slug}-${a.photoUrl}-${a.bio}-${a.bioEn}`}
              artist={{
                id: a.id,
                name: a.name,
                slug: a.slug,
                photoUrl: a.photoUrl,
                bio: a.bio,
                bioEn: a.bioEn,
                count: a._count.artworks,
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted">Aucun artiste pour le moment.</p>
      )}
    </div>
  );
}
