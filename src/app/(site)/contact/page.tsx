import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { StatusBadge } from "@/components/StatusBadge";
import { artworkReference, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez la Galerie Papot pour une œuvre, une réservation ou une commande.",
};

export default async function ContactPage(props: PageProps<"/contact">) {
  const sp = await props.searchParams;
  const id = Number(sp.oeuvre);
  const subject = typeof sp.objet === "string" ? sp.objet : "";
  const artwork = Number.isInteger(id) && id > 0 ? await prisma.artwork.findUnique({ where: { id } }) : null;

  let defaultMessage = "";
  let intro = "Une question, une envie de commande ou de visite d'atelier ? Écrivez-nous.";
  if (artwork) {
    const ref = `« ${artwork.title} » (réf. ${artworkReference(artwork.id)})`;
    const status = toStatus(artwork.status);
    if (status === "VENDU" || subject === "similaire") {
      intro = "Cette œuvre est vendue, mais la galerie peut vous proposer une réédition ou une création dans le même esprit.";
      defaultMessage = `Bonjour,\n\nL'œuvre ${ref} m'a beaucoup plu. Serait-il possible d'envisager une réédition ou une œuvre dans le même style ?\n\n`;
    } else if (status === "RESERVE" || subject === "attente") {
      intro = "Cette œuvre fait l'objet d'une option. Laissez vos coordonnées pour être prévenu si elle se libère.";
      defaultMessage = `Bonjour,\n\nJe souhaite être placé en liste d'attente pour l'œuvre ${ref}.\n\n`;
    } else {
      intro = "Vous souhaitez acquérir cette œuvre ou en savoir plus ? La galerie vous répond rapidement.";
      defaultMessage = `Bonjour,\n\nJe suis intéressé par l'œuvre ${ref} et souhaiterais me positionner.\n\n`;
    }
  }

  return (
    <div className="container-page grid gap-12 pt-10 md:grid-cols-[1fr_1.3fr] md:gap-20 md:pt-16">
      <div>
        <h1 className="font-serif text-5xl md:text-6xl">Contact</h1>
        <p className="mt-4 max-w-md leading-relaxed text-muted">{intro}</p>

        {artwork && (
          <Link href={`/oeuvres/${artwork.slug}`} className="mt-8 flex items-center gap-4 rounded-sm border border-line bg-white p-3 hover:border-ink/30">
            {artwork.imageUrl && (
              <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-line">
                <Image src={artwork.imageUrl} alt="" fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-serif text-xl">{artwork.title}</p>
              <p className="text-sm text-muted">
                Réf. {artworkReference(artwork.id)} · {formatPrice(artwork.price)}
              </p>
              <StatusBadge status={toStatus(artwork.status)} className="mt-1 !bg-transparent !px-0 !ring-0" />
            </div>
          </Link>
        )}
      </div>

      <ContactForm artworkId={artwork?.id} defaultMessage={defaultMessage} />
    </div>
  );
}
