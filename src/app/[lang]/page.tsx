import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArtworkCard } from "@/components/ArtworkCard";
import { localizeArtwork, themeName, toCard } from "@/lib/artworks";
import { paragraphs, plural } from "@/lib/dictionaries";
import { alternates, localePath, pick } from "@/lib/i18n";
import { getLocale, getTranslations } from "@/lib/locale";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: alternates(await getLocale(), "/") };
}

export default async function HomePage() {
  const { lang, t } = await getTranslations();
  const [flagged, themes, artists] = await Promise.all([
    prisma.artwork.findMany({
      where: { isNew: true },
      include: { theme: true, medium: true },
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
    prisma.artist.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { artworks: true } } } }),
  ]);

  // Sans œuvre marquée « Nouveauté », on montre les derniers ajouts
  const news = flagged.length
    ? flagged
    : await prisma.artwork.findMany({ include: { theme: true, medium: true }, orderBy: { createdAt: "desc" }, take: 4 });
  // Thèmes classés selon leur nom dans la langue affichée
  themes.sort((a, b) => themeName(a, lang).localeCompare(themeName(b, lang), lang));
  const hero = news[0];
  const heroText = hero && localizeArtwork(hero, lang);

  return (
    <>
      {/* Accueil : la dernière œuvre en grand */}
      <section className="container-page grid items-center gap-10 pt-10 pb-16 md:grid-cols-[1fr_1.1fr] md:gap-16 md:pt-16 md:pb-24">
        <div className="order-2 md:order-1">
          <p className="text-xs tracking-[0.3em] text-muted uppercase">{t.home.eyebrow}</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            {t.home.titleLine1}
            <br />
            <em className="italic">{t.home.titleLine2}</em>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            {t.home.intro}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={localePath(lang, "/oeuvres")} className="btn btn-primary">
              {t.home.discover}
            </Link>
            <Link href="#nouveautes" className="btn btn-outline">
              {t.home.news}
            </Link>
          </div>
        </div>

        {hero?.imageUrl && (
          <Link href={localePath(lang, `/oeuvres/${hero.slug}`)} className="group relative order-1 block md:order-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line sm:aspect-[5/4] md:aspect-[4/5]">
              <Image
                src={hero.imageUrl}
                alt={heroText.title}
                fill
                priority
                quality={90}
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover transition duration-1000 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-3 text-sm text-muted">
              <span className="font-serif text-lg text-ink italic">{heroText.title}</span>
              {heroText.medium && ` · ${heroText.medium}`}
            </p>
          </Link>
        )}
      </section>

      {/* Nouveautés */}
      <section id="nouveautes" className="container-page scroll-mt-20 py-12">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 className="font-serif text-4xl">{t.home.news}</h2>
          <Link href={localePath(lang, "/oeuvres")} className="text-sm text-muted hover:text-ink">
            {t.home.allArtworks}
          </Link>
        </div>
        {news.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
            {news.map((a) => (
              <ArtworkCard key={a.id} artwork={toCard(a, lang)} lang={lang} />
            ))}
          </div>
        ) : (
          <p className="text-muted">{t.home.comingSoon}</p>
        )}
      </section>

      {/* Démarche artistique */}
      <section id="demarche" className="mt-12 scroll-mt-20 bg-white py-20">
        <div className="container-page grid gap-10 md:grid-cols-[1fr_2fr]">
          <h2 className="font-serif text-4xl">{t.home.approach}</h2>
          <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-ink/80">
            {paragraphs(t.home.approachText).map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
            <Link href={localePath(lang, "/contact")} className="inline-block text-base text-ink underline underline-offset-4">
              {t.home.contactGallery}
            </Link>
          </div>
        </div>
      </section>

      {/* Artistes */}
      {artists.length > 0 && (
        <section id="artistes" className="container-page scroll-mt-20 pt-20">
          <h2 className="mb-8 font-serif text-4xl">{t.home.artists}</h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => {
              const bio = pick(lang, artist.bio, artist.bioEn);
              return (
                <article key={artist.id}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line">
                    {artist.photoUrl ? (
                      <Image
                        src={artist.photoUrl}
                        alt={artist.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center font-serif text-7xl text-muted/60" aria-hidden>
                        {artist.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 font-serif text-2xl">{artist.name}</h3>
                  {paragraphs(bio).map((p, i) => (
                    <p key={i} className="mt-2 leading-relaxed whitespace-pre-line text-ink/80">{p}</p>
                  ))}
                  {artist._count.artworks > 0 && (
                    <Link
                      href={localePath(lang, `/oeuvres?artiste=${artist.slug}`)}
                      className="mt-3 inline-block text-sm text-muted underline underline-offset-4 hover:text-ink"
                    >
                      {t.home.artistWorks}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Thèmes */}
      {themes.length > 0 && (
        <section className="container-page py-20">
          <h2 className="mb-8 font-serif text-4xl">{t.home.themes}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {themes.map((theme) => (
              <Link
                key={theme.id}
                href={localePath(lang, `/oeuvres?theme=${theme.slug}`)}
                className="group relative block aspect-square overflow-hidden rounded-sm bg-line"
              >
                {theme.artworks[0]?.imageUrl && (
                  <Image
                    src={theme.artworks[0].imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-serif text-2xl">{themeName(theme, lang)}</p>
                  <p className="text-xs tracking-wider uppercase opacity-80">
                    {plural(theme._count.artworks, t.home.artworkCountOne, t.home.artworkCountMany)}
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
