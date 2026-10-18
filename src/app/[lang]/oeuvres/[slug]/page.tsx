import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArtworkAction } from "@/components/ArtworkAction";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ArtworkGallery } from "@/components/ArtworkGallery";
import { StatusBadge } from "@/components/StatusBadge";
import { allImages, artworkDetails, localizeArtwork, themeName, toCard } from "@/lib/artworks";
import { artworkReference, formatPrice } from "@/lib/format";
import { alternates, localePath } from "@/lib/i18n";
import { getLocale, getTranslations } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

const getArtwork = cache((slug: string) =>
  prisma.artwork.findUnique({ where: { slug }, include: { ...artworkDetails, images: true } }),
);

export async function generateMetadata(props: PageProps<"/[lang]/oeuvres/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const [artwork, lang] = await Promise.all([getArtwork(slug), getLocale()]);
  if (!artwork) return {};
  const text = localizeArtwork(artwork, lang);
  return {
    title: text.title,
    description: text.description.slice(0, 160),
    alternates: alternates(lang, `/oeuvres/${artwork.slug}`),
    openGraph: { images: artwork.imageUrl ? [artwork.imageUrl] : [] },
  };
}

export default async function ArtworkPage(props: PageProps<"/[lang]/oeuvres/[slug]">) {
  const { slug } = await props.params;
  const { lang, t } = await getTranslations();
  const artwork = await getArtwork(slug);
  if (!artwork) notFound();
  const text = localizeArtwork(artwork, lang);
  const theme = artwork.theme && { slug: artwork.theme.slug, name: themeName(artwork.theme, lang) };

  const status = toStatus(artwork.status);
  const related = artwork.themeId
    ? await prisma.artwork.findMany({
        where: { themeId: artwork.themeId, id: { not: artwork.id } },
        include: { theme: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 4,
      })
    : [];

  const specs = [
    [t.artwork.medium, text.medium],
    [t.artwork.support, text.support],
    [t.artwork.dimensions, text.dimensions],
    [t.artwork.theme, theme?.name],
    [t.artwork.reference, artworkReference(artwork.id)],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <div className="container-page pt-6 md:pt-10">
      <nav className="mb-6 text-sm text-muted" aria-label={t.artwork.breadcrumb}>
        <Link href={localePath(lang, "/oeuvres")} className="hover:text-ink">{t.nav.artworks}</Link>
        {theme && (
          <>
            {" / "}
            <Link href={localePath(lang, `/oeuvres?theme=${theme.slug}`)} className="hover:text-ink">
              {theme.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <ArtworkGallery images={allImages(artwork)} title={text.title} lang={lang} muted={status === "VENDU"} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <StatusBadge status={status} lang={lang} className="!bg-transparent !px-0 !ring-0" />
          <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{text.title}</h1>
          {artwork.artist && (
            <p className="mt-2 text-lg text-muted">
              {t.artwork.by}{" "}
              <Link
                href={localePath(lang, `/oeuvres?artiste=${artwork.artist.slug}`)}
                className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                title={t.artwork.artistWorks(artwork.artist.name)}
              >
                {artwork.artist.name}
              </Link>
            </p>
          )}
          <p className={`mt-3 text-2xl ${status === "VENDU" ? "text-muted line-through decoration-1" : ""}`}>
            {formatPrice(artwork.price, lang)}
          </p>

          <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8">
            <ArtworkAction id={artwork.id} status={status} lang={lang} />
          </div>

          {text.description && (
            <div className="mt-10">
              <h2 className="label">{t.artwork.statement}</h2>
              <div className="space-y-4 leading-relaxed text-ink/80">
                {text.description.split(/\n{2,}/).map((p, i) => (
                  <p key={i} className="whitespace-pre-line">{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 border-b border-line pb-4 font-serif text-3xl">{t.artwork.related}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4">
            {related.map((a) => (
              <ArtworkCard key={a.id} artwork={toCard(a, lang)} lang={lang} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
