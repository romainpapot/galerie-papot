import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { StatusBadge } from "@/components/StatusBadge";
import { localizeArtwork } from "@/lib/artworks";
import { artworkReference, formatPrice } from "@/lib/format";
import { alternates, localePath } from "@/lib/i18n";
import { getTranslations } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getTranslations();
  return { title: t.contact.title, description: t.contact.description, alternates: alternates(lang, "/contact") };
}

export default async function ContactPage(props: PageProps<"/[lang]/contact">) {
  const { lang, t } = await getTranslations();
  const sp = await props.searchParams;
  const id = Number(sp.oeuvre);
  const subject = typeof sp.objet === "string" ? sp.objet : "";
  const artwork = Number.isInteger(id) && id > 0 ? await prisma.artwork.findUnique({ where: { id } }) : null;

  const title = artwork && localizeArtwork(artwork, lang).title;

  let defaultMessage = "";
  let intro = t.contact.intro;
  if (artwork && title) {
    const ref = t.contact.reference(title, artworkReference(artwork.id));
    const status = toStatus(artwork.status);
    if (status === "VENDU" || subject === "similaire") {
      intro = t.contact.introSold;
      defaultMessage = t.contact.messageSold(ref);
    } else if (status === "RESERVE" || subject === "attente") {
      intro = t.contact.introReserved;
      defaultMessage = t.contact.messageReserved(ref);
    } else {
      intro = t.contact.introAvailable;
      defaultMessage = t.contact.messageAvailable(ref);
    }
  }

  return (
    <div className="container-page grid gap-12 pt-10 md:grid-cols-[1fr_1.3fr] md:gap-20 md:pt-16">
      <div>
        <h1 className="font-serif text-5xl md:text-6xl">{t.contact.title}</h1>
        <p className="mt-4 max-w-md leading-relaxed text-muted">{intro}</p>

        {artwork && (
          <Link href={localePath(lang, `/oeuvres/${artwork.slug}`)} className="mt-8 flex items-center gap-4 rounded-sm border border-line bg-white p-3 hover:border-ink/30">
            {artwork.imageUrl && (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-line">
                <Image src={artwork.imageUrl} alt="" fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-serif text-xl">{title}</p>
              <p className="text-sm text-muted">
                {t.contact.ref} {artworkReference(artwork.id)} · {formatPrice(artwork.price, lang)}
              </p>
              <StatusBadge status={toStatus(artwork.status)} lang={lang} className="mt-1 !bg-transparent !px-0 !ring-0" />
            </div>
          </Link>
        )}
      </div>

      <ContactForm artworkId={artwork?.id} defaultMessage={defaultMessage} lang={lang} />
    </div>
  );
}
