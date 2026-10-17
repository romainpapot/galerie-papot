import Link from "next/link";
import { artworkReference, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { STATUSES, STATUS_LABELS } from "@/lib/status";

export default async function Dashboard() {
  const [byStatus, themes, unread, latest] = await Promise.all([
    prisma.artwork.groupBy({ by: ["status"], _count: true }),
    prisma.theme.count(),
    prisma.inquiry.count({ where: { isRead: false } }),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { artwork: true } }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">Tableau de bord</h1>
        <Link href="/admin/oeuvres/nouvelle" className="btn btn-primary">+ Ajouter une œuvre</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {STATUSES.map((s) => (
          <Stat key={s} label={`${STATUS_LABELS[s]}s`} value={count(s)} href={`/admin/oeuvres?statut=${s}`} />
        ))}
        <Stat label="Thèmes" value={themes} href="/admin/themes" />
        <Stat label="Demandes non lues" value={unread} href="/admin/demandes" highlight={unread > 0} />
      </div>

      <section>
        <h2 className="mb-4 text-sm font-medium tracking-wider text-muted uppercase">Dernières demandes</h2>
        {latest.length ? (
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {latest.map((q) => (
              <li key={q.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className={q.isRead ? "" : "font-semibold"}>
                    {q.visitorName}
                    {q.artwork && (
                      <span className="font-normal text-muted"> · {q.artwork.title} ({artworkReference(q.artwork.id)})</span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">{q.message}</p>
                </div>
                <p className="shrink-0 text-xs text-muted">{formatDate(q.createdAt)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Aucune demande pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`rounded-lg border p-5 transition-colors hover:border-ink/30 ${highlight ? "border-ink bg-ink text-paper" : "border-line bg-white"}`}>
      <p className="font-serif text-4xl">{value}</p>
      <p className={`mt-1 text-xs tracking-wider uppercase ${highlight ? "text-paper/70" : "text-muted"}`}>{label}</p>
    </Link>
  );
}
