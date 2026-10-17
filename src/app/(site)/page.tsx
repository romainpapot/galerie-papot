import Image from "next/image";
import Link from "next/link";
import { ArtworkCard } from "@/components/ArtworkCard";
import { toCard } from "@/lib/artworks";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [flagged, themes] = await Promise.all([
    prisma.artwork.findMany({
      where: { isNew: true },
      include: { theme: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.theme.findMany({
      orderBy: { name: "asc" },
      include: {
        artworks: { orderBy: { createdAt: "desc" }, take: 1, select: { imageUrl: true } },
        _count: { select: { artworks: true } },
      },
    }),
  ]);

  // Sans œuvre marquée « Nouveauté », on montre les derniers ajouts
  const news = flagged.length
    ? flagged
    : await prisma.artwork.findMany({ include: { theme: true }, orderBy: { createdAt: "desc" }, take: 4 });
  const hero = news[0];

  return (
    <>
      {/* Accueil : la dernière œuvre en grand */}
      <section className="container-page grid items-center gap-10 pt-10 pb-16 md:grid-cols-[1fr_1.1fr] md:gap-16 md:pt-16 md:pb-24">
        <div className="order-2 md:order-1">
          <p className="text-xs tracking-[0.3em] text-muted uppercase">Peintures originales</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            La couleur
            <br />
            <em className="italic">comme langage</em>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Des œuvres uniques, vibrantes et joyeuses, à découvrir et à accueillir chez vous.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/oeuvres" className="btn btn-primary">
              Découvrir les œuvres
            </Link>
            <Link href="#nouveautes" className="btn btn-outline">
              Nouveautés
            </Link>
          </div>
        </div>

        {hero?.imageUrl && (
          <Link href={`/oeuvres/${hero.slug}`} className="group relative order-1 block md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line sm:aspect-[5/4] md:aspect-[4/5]">
              <Image
                src={hero.imageUrl}
                alt={hero.title}
                fill
                priority
                quality={90}
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover transition duration-1000 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="font-serif text-lg text-ink italic">{hero.title}</span>
              {hero.medium && ` · ${hero.medium}`}
            </p>
          </Link>
        )}
      </section>

      {/* Nouveautés */}
      <section id="nouveautes" className="container-page scroll-mt-20 py-12">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 className="font-serif text-4xl">Nouveautés</h2>
          <Link href="/oeuvres" className="text-sm text-muted hover:text-ink">
            Toutes les œuvres →
          </Link>
        </div>
        {news.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
            {news.map((a) => (
              <ArtworkCard key={a.id} artwork={toCard(a)} />
            ))}
          </div>
        ) : (
          <p className="text-muted">Les premières œuvres arrivent bientôt.</p>
        )}
      </section>

      {/* Démarche artistique */}
      <section id="demarche" className="mt-12 scroll-mt-20 bg-white py-20">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_2fr]">
          <h2 className="font-serif text-4xl">Démarche</h2>
          <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-ink/80">
            <p>
              Chaque toile naît d&apos;une émotion simple : la lumière d&apos;un fruit, l&apos;éclat d&apos;une
              carrosserie, le regard d&apos;un animal. La couleur y est un point de départ, jamais un décor.
            </p>
            <p>
              Peintes à l&apos;acrylique, à l&apos;huile ou à la gouache, les œuvres sont toutes des pièces
              uniques, signées et accompagnées d&apos;un certificat d&apos;authenticité.
            </p>
            <Link href="/contact" className="inline-block text-base text-ink underline underline-offset-4">
              Contacter la galerie
            </Link>
          </div>
        </div>
      </section>

      {/* Thèmes */}
      {themes.length > 0 && (
        <section className="container-page py-20">
          <h2 className="mb-8 font-serif text-4xl">Thèmes</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {themes.map((t) => (
              <Link
                key={t.id}
                href={`/oeuvres?theme=${t.slug}`}
                className="group relative block aspect-square overflow-hidden rounded-sm bg-line"
              >
                {t.artworks[0]?.imageUrl && (
                  <Image
                    src={t.artworks[0].imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-serif text-2xl">{t.name}</p>
                  <p className="text-xs tracking-wider uppercase opacity-80">
                    {t._count.artworks} œuvre{t._count.artworks > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
