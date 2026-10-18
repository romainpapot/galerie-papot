import Image from "next/image";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { QuickStatus } from "@/components/admin/QuickStatus";
import { artworkReference, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isStatus, STATUSES, STATUS_LABELS, toStatus } from "@/lib/status";
import { deleteArtwork } from "../../actions";

const NOTICES: Record<string, string> = {
  cree: "Œuvre ajoutée.",
  modifie: "Œuvre enregistrée.",
  supprime: "Œuvre supprimée.",
};

export default async function AdminArtworks(props: PageProps<"/admin/oeuvres">) {
  const sp = await props.searchParams;
  const status = isStatus(sp.statut) ? sp.statut : undefined;
  const notice = typeof sp.ok === "string" ? NOTICES[sp.ok] : undefined;

  const artworks = await prisma.artwork.findMany({
    where: status ? { status } : {},
    include: { theme: true, artist: true },
    orderBy: { createdAt: "desc" },
  });

  const tab = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm ${active ? "bg-white text-ink ring-1 ring-line" : "text-muted hover:text-ink"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">Œuvres</h1>
        <Link href="/admin/oeuvres/nouvelle" className="btn btn-primary">+ Ajouter une œuvre</Link>
      </div>

      {notice && <p className="rounded-lg bg-available/10 px-4 py-3 text-sm text-available" role="status">{notice}</p>}

      <div className="flex flex-wrap gap-1">
        <Link href="/admin/oeuvres" className={tab(!status)}>Toutes</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/oeuvres?statut=${s}`} className={tab(status === s)}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {artworks.length === 0 ? (
        <p className="py-10 text-muted">Aucune œuvre.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {artworks.map((a) => (
            <li key={a.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded bg-line">
                  {a.imageUrl && <Image src={a.imageUrl} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <Link href={`/admin/oeuvres/${a.id}`} className="block truncate font-medium hover:underline">
                    {a.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {artworkReference(a.id)}{a.artist && ` · ${a.artist.name}`} · {a.theme?.name ?? "Sans thème"} · {formatPrice(a.price)}
                  </p>
                </div>
              </div>
              <QuickStatus id={a.id} status={toStatus(a.status)} isNew={a.isNew} />
              <div className="flex items-center gap-4 text-sm">
                <Link href={`/oeuvres/${a.slug}`} target="_blank" className="text-muted hover:text-ink">Voir</Link>
                <Link href={`/admin/oeuvres/${a.id}`} className="text-ink underline underline-offset-4">Modifier</Link>
                <form action={deleteArtwork}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmSubmit message={`Supprimer définitivement « ${a.title} » ?`} className="text-red-700 hover:underline">
                    Supprimer
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
