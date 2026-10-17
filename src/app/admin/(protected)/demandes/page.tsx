import Link from "next/link";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { StatusBadge } from "@/components/StatusBadge";
import { artworkReference, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";
import { deleteInquiry, setInquiryRead } from "../../actions";

export const metadata = { title: "Demandes" };

export default async function AdminInquiries() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    include: { artwork: true },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-serif text-4xl">Demandes de contact</h1>
      {inquiries.length === 0 && <p className="text-muted">Aucune demande pour le moment.</p>}

      <ul className="space-y-4">
        {inquiries.map((q) => (
          <li key={q.id} className={`rounded-lg border bg-white p-5 ${q.isRead ? "border-line" : "border-ink"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {!q.isRead && <span className="mr-2 inline-block size-2 rounded-full bg-ink align-middle" aria-label="Non lue" />}
                  {q.visitorName}
                  {q.locale === "en" && (
                    <span className="ml-2 rounded-full bg-line px-2 py-0.5 align-middle text-[11px] font-medium tracking-wider" title="Envoyée depuis le site en anglais">
                      EN
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">
                  <a href={`mailto:${q.visitorEmail}`} className="underline underline-offset-2 hover:text-ink">{q.visitorEmail}</a>
                  {q.visitorPhone && (
                    <> · <a href={`tel:${q.visitorPhone.replace(/\s/g, "")}`} className="hover:text-ink">{q.visitorPhone}</a></>
                  )}
                </p>
              </div>
              <p className="text-xs text-muted">{formatDate(q.createdAt)}</p>
            </div>

            {q.artwork && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/admin/oeuvres/${q.artwork.id}`} className="underline underline-offset-2">
                  {q.artwork.title} ({artworkReference(q.artwork.id)})
                </Link>
                <StatusBadge status={toStatus(q.artwork.status)} className="!py-0.5" />
              </p>
            )}

            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink/80">{q.message}</p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <a href={`mailto:${q.visitorEmail}?subject=${encodeURIComponent(`Galerie Papot${q.artwork ? ` · ${q.artwork.title}` : ""}`)}`} className="text-ink underline underline-offset-4">
                Répondre
              </a>
              <form action={setInquiryRead}>
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="isRead" value={String(!q.isRead)} />
                <button className="text-muted hover:text-ink">{q.isRead ? "Marquer non lue" : "Marquer comme lue"}</button>
              </form>
              <form action={deleteInquiry}>
                <input type="hidden" name="id" value={q.id} />
                <ConfirmSubmit message="Supprimer cette demande ?" className="text-red-700 hover:underline">Supprimer</ConfirmSubmit>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
