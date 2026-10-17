import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BarList, ColumnChart, Kpi, Panel, formatDuration, formatNumber, formatPercent } from "@/components/admin/StatsCharts";
import { artworkReference } from "@/lib/format";
import { PERIODS, getStats, toPeriod } from "@/lib/stats";
import { STATUS_LABELS, type ArtworkStatus } from "@/lib/status";

const STATUS_DOTS: Record<ArtworkStatus, string> = {
  DISPONIBLE: "bg-available",
  RESERVE: "bg-reserved",
  VENDU: "bg-sold",
};

export const metadata: Metadata = { title: "Statistiques" };

const dayLong = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", timeZone: "UTC" });
const dayShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

export default async function StatsPage(props: PageProps<"/admin/statistiques">) {
  const days = toPeriod((await props.searchParams).periode);
  const s = await getStats(days);
  const { current: c, previous: p } = s;

  const timeline = s.timeline.map((t) => {
    const date = new Date(s.monthly ? `${t.key}-01` : t.key);
    return {
      label: (s.monthly ? monthLong : dayLong).format(date),
      short: (s.monthly ? monthShort : dayShort).format(date),
      value: t.visits,
    };
  });
  const hours = s.hours.map((value, h) => ({ label: `${h} h – ${h + 1} h`, short: `${h} h`, value }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-4xl">Statistiques</h1>
        <nav className="flex flex-wrap gap-1" aria-label="Période">
          {PERIODS.map((period) => (
            <Link
              key={period.days}
              href={`/admin/statistiques?periode=${period.days}`}
              className={`rounded-full px-3 py-1.5 text-sm ${period.days === days ? "bg-white text-ink ring-1 ring-line" : "text-muted hover:text-ink"}`}
              aria-current={period.days === days ? "page" : undefined}
            >
              {period.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Visites" value={formatNumber(c.visits)} current={c.visits} previous={p.visits}
          hint="Visiteurs distincts par jour, cumulés sur la période (sans cookie : un visiteur revenant un autre jour compte à nouveau)." />
        <Kpi label="Pages vues" value={formatNumber(c.pageViews)} current={c.pageViews} previous={p.pageViews} />
        <Kpi label="Pages par visite" value={formatNumber(c.pagesPerVisit)} current={c.pagesPerVisit} previous={p.pagesPerVisit} />
        <Kpi label="Temps par visite" value={formatDuration(c.secondsPerVisit)} current={c.secondsPerVisit} previous={p.secondsPerVisit}
          hint="Temps pendant lequel l'onglet du site est resté affiché." />
        <Kpi label="Rebond" value={formatPercent(c.bounceRate)} current={c.bounceRate} previous={p.bounceRate} lowerIsBetter
          hint="Part des visites n'ayant consulté qu'une seule page." />
        <Kpi label="Demandes / visites" value={formatPercent(c.conversion)} current={c.conversion} previous={p.conversion}
          hint={`${c.inquiries} demande${c.inquiries > 1 ? "s" : ""} de contact reçue${c.inquiries > 1 ? "s" : ""} sur la période.`} />
      </div>
      <p className="-mt-4 text-xs text-muted">Évolution par rapport aux {PERIODS.find((x) => x.days === days)!.label} précédents.</p>

      <Panel title={s.monthly ? "Visites par mois" : "Visites par jour"}>
        <ColumnChart data={timeline} unit="visites" />
      </Panel>

      <Panel title="Vues par œuvre" note="Visiteurs : personnes distinctes ayant ouvert la fiche · Temps moyen passé sur la fiche · Demandes de contact liées à l'œuvre.">
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs tracking-wider text-muted uppercase">
              <tr className="border-b border-line">
                <th className="px-5 pb-2 font-medium">Œuvre</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="w-48 pb-2 font-medium">Vues</th>
                <th className="pb-2 text-right font-medium">Visiteurs</th>
                <th className="pb-2 text-right font-medium">Temps moyen</th>
                <th className="pb-2 text-right font-medium">Demandes</th>
                <th className="px-5 pb-2 text-right font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.artworks.map((a) => (
                <tr key={a.id} className={a.views ? "" : "text-muted"}>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded bg-line">
                        {a.imageUrl && <Image src={a.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/oeuvres/${a.id}`} className="block truncate font-medium text-ink hover:underline">{a.title}</Link>
                        <p className="text-xs text-muted">{artworkReference(a.id)} · {a.theme}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${STATUS_DOTS[a.status]}`} aria-hidden />
                    {STATUS_LABELS[a.status]}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-8 text-right tabular-nums">{a.views}</span>
                      <div className="h-1.5 flex-1 rounded-full bg-line/50">
                        <div className="h-full rounded-full bg-ink/75" style={{ width: `${(a.views / Math.max(1, s.artworks[0]?.views ?? 1)) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="text-right tabular-nums">{a.visitors}</td>
                  <td className="text-right tabular-nums">{a.avgSeconds ? formatDuration(a.avgSeconds) : "—"}</td>
                  <td className="text-right tabular-nums">{a.inquiries}</td>
                  <td className="px-5 text-right tabular-nums">{a.visitors ? formatPercent(a.conversion) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {(s.noInquiry.length > 0 || s.unseen.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {s.noInquiry.length > 0 && (
            <Panel title="Très consultées, sans demande" note="Œuvres disponibles qui attirent sans déclencher de contact : prix, photos ou description à revoir ?">
              <ArtworkList items={s.noInquiry.map((a) => ({ ...a, detail: `${a.views} vues · ${a.avgSeconds ? formatDuration(a.avgSeconds) : "—"} en moyenne` }))} />
            </Panel>
          )}
          {s.unseen.length > 0 && (
            <Panel title="Jamais consultées sur la période" note="Œuvres disponibles à mettre en avant : nouveauté, page d'accueil, réseaux sociaux.">
              <ArtworkList items={s.unseen.slice(0, 8).map((a) => ({ ...a, detail: a.theme }))} />
              {s.unseen.length > 8 && <p className="mt-3 text-xs text-muted">et {s.unseen.length - 8} autre{s.unseen.length - 8 > 1 ? "s" : ""}</p>}
            </Panel>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Provenance des visites" note="Moteurs de recherche, réseaux sociaux, sites partenaires… Ajoutez ?utm_source=newsletter à vos liens pour les distinguer.">
          <BarList rows={s.sources} />
        </Panel>
        <Panel title="Thèmes les plus consultés" note="Visites des fiches œuvres, regroupées par thème.">
          <BarList rows={s.themes} />
        </Panel>
        <Panel title="Pages les plus vues">
          <BarList rows={s.pages.map((pg) => ({ label: pg.label, value: pg.value, href: pg.path }))} />
        </Panel>
        <Panel title="Appareils" note="Une majorité de mobiles impose des visuels lisibles sur petit écran.">
          <BarList rows={s.devices} />
        </Panel>
      </div>

      <Panel title="Heures de visite" note="Pages vues selon l'heure (Paris) : les meilleurs moments pour publier sur les réseaux sociaux.">
        <ColumnChart data={hours} unit="pages vues" ticks={7} />
      </Panel>

      <p className="text-xs text-muted">
        Mesure d&apos;audience interne, sans cookie ni service tiers : aucune donnée personnelle n&apos;est conservée
        et les visites sont supprimées au bout de 13 mois. Vos propres visites ne sont pas comptées lorsque vous êtes
        connecté au back-office.
      </p>
    </div>
  );
}

function ArtworkList({ items }: { items: { id: number; title: string; imageUrl: string; detail: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-3 text-sm">
          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-line">
            {a.imageUrl && <Image src={a.imageUrl} alt="" fill sizes="40px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/oeuvres/${a.id}`} className="block truncate font-medium hover:underline">{a.title}</Link>
            <p className="text-xs text-muted">{a.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
