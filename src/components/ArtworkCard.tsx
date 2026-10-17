import Image from "next/image";
import Link from "next/link";
import type { ArtworkCardData } from "@/lib/artworks";
import { getDictionary } from "@/lib/dictionaries";
import { formatPrice } from "@/lib/format";
import { localePath, type Locale } from "@/lib/i18n";
import { StatusBadge } from "./StatusBadge";

type Props = { artwork: ArtworkCardData; lang: Locale; priority?: boolean };

export function ArtworkCard({ artwork, lang, priority = false }: Props) {
  const sold = artwork.status === "VENDU";
  const t = getDictionary(lang).card;

  return (
    <Link href={localePath(lang, `/oeuvres/${artwork.slug}`)} className="group block focus-visible:outline-none">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-line/50 ring-ink/30 group-focus-visible:ring-2">
        {artwork.imageUrl && (
          <Image
            src={artwork.imageUrl}
            alt={artwork.title}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className={`object-cover transition duration-700 ease-out group-hover:scale-[1.03] ${
              sold ? "opacity-70 grayscale-[45%] group-hover:grayscale-0 group-hover:opacity-100" : ""
            }`}
          />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <StatusBadge status={artwork.status} lang={lang} />
          {artwork.isNew && !sold && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-wider text-ink uppercase ring-1 ring-ink/10 backdrop-blur">
              {t.new}
            </span>
          )}
        </div>
      </div>
      <div className={`mt-3 space-y-0.5 ${sold ? "text-muted" : ""}`}>
        {artwork.theme && (
          <p className="text-[11px] tracking-widest text-muted uppercase">{artwork.theme.name}</p>
        )}
        <h3 className="font-serif text-xl leading-tight group-hover:underline group-hover:underline-offset-4 decoration-1">
          {artwork.title}
        </h3>
        <p className="text-sm text-muted">{sold ? t.sold : formatPrice(artwork.price, lang)}</p>
      </div>
    </Link>
  );
}
