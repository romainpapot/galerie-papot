import "server-only";
import { RETENTION_DAYS } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { toStatus } from "@/lib/status";

export const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "3 mois" },
  { days: 365, label: "12 mois" },
] as const;

export function toPeriod(value: unknown) {
  return PERIODS.find((p) => String(p.days) === value)?.days ?? 30;
}

const DAY = 86_400_000;
const TZ = "Europe/Paris";
const dayKey = new Intl.DateTimeFormat("fr-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hourOf = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "numeric", hourCycle: "h23" });

type View = {
  createdAt: Date;
  visitorId: string;
  artworkId: number | null;
  path: string;
  source: string;
  device: string;
  duration: number | null;
};

/** Visites = empreintes distinctes (renouvelées chaque jour, donc ≈ visiteurs par jour cumulés). */
function summarize(views: View[], inquiries: number) {
  const pagesByVisit = new Map<string, number>();
  let seconds = 0;
  for (const v of views) {
    pagesByVisit.set(v.visitorId, (pagesByVisit.get(v.visitorId) ?? 0) + 1);
    seconds += v.duration ?? 0;
  }
  const visits = pagesByVisit.size;
  const bounces = [...pagesByVisit.values()].filter((n) => n === 1).length;
  return {
    visits,
    pageViews: views.length,
    pagesPerVisit: visits ? views.length / visits : 0,
    secondsPerVisit: visits ? seconds / visits : 0,
    bounceRate: visits ? bounces / visits : 0,
    inquiries,
    conversion: visits ? inquiries / visits : 0,
  };
}

export type Summary = ReturnType<typeof summarize>;

/** Visites distinctes regroupées par clé, triées par nombre décroissant. */
function visitsBy(views: View[], key: (v: View) => string) {
  const sets = new Map<string, Set<string>>();
  for (const v of views) {
    const k = key(v);
    if (!sets.has(k)) sets.set(k, new Set());
    sets.get(k)!.add(v.visitorId);
  }
  return [...sets].map(([label, s]) => ({ label, value: s.size })).sort((a, b) => b.value - a.value);
}

function topWithOthers(rows: { label: string; value: number }[], max: number) {
  if (rows.length <= max) return rows;
  const others = rows.slice(max - 1).reduce((sum, r) => sum + r.value, 0);
  return [...rows.slice(0, max - 1), { label: "Autres", value: others }];
}

export async function getStats(days: number) {
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const previousFrom = new Date(now.getTime() - 2 * days * DAY);

  // Purge des données au-delà de la durée de conservation
  await prisma.pageView.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - RETENTION_DAYS * DAY) } } });

  const [allViews, inquiries, artworks] = await Promise.all([
    prisma.pageView.findMany({
      where: { createdAt: { gte: previousFrom } },
      select: { createdAt: true, visitorId: true, artworkId: true, path: true, source: true, device: true, duration: true },
    }),
    prisma.inquiry.findMany({ where: { createdAt: { gte: previousFrom } }, select: { createdAt: true, artworkId: true } }),
    prisma.artwork.findMany({
      select: { id: true, slug: true, title: true, imageUrl: true, status: true, createdAt: true, theme: { select: { name: true } } },
    }),
  ]);

  const views = allViews.filter((v) => v.createdAt >= from);
  const periodInquiries = inquiries.filter((q) => q.createdAt >= from);
  const current = summarize(views, periodInquiries.length);
  const previous = summarize(
    allViews.filter((v) => v.createdAt < from),
    inquiries.length - periodInquiries.length,
  );

  // Évolution : par jour, ou par mois sur 12 mois
  const monthly = days > 90;
  const bucketOf = (d: Date) => (monthly ? dayKey.format(d).slice(0, 7) : dayKey.format(d));
  const buckets = new Map<string, { visits: Set<string>; views: number }>();
  for (let t = from.getTime(); t <= now.getTime(); t += DAY) {
    buckets.set(bucketOf(new Date(t)), { visits: new Set(), views: 0 });
  }
  for (const v of views) {
    const b = buckets.get(bucketOf(v.createdAt));
    if (!b) continue;
    b.visits.add(v.visitorId);
    b.views++;
  }
  const timeline = [...buckets].map(([key, b]) => ({ key, visits: b.visits.size, views: b.views }));

  // Œuvres
  const byArtwork = new Map<number, { views: number; visitors: Set<string>; seconds: number; timed: number; inquiries: number }>();
  const entry = (id: number) => {
    if (!byArtwork.has(id)) byArtwork.set(id, { views: 0, visitors: new Set(), seconds: 0, timed: 0, inquiries: 0 });
    return byArtwork.get(id)!;
  };
  for (const v of views) {
    if (v.artworkId == null) continue;
    const e = entry(v.artworkId);
    e.views++;
    e.visitors.add(v.visitorId);
    if (v.duration) {
      e.seconds += v.duration;
      e.timed++;
    }
  }
  for (const q of periodInquiries) if (q.artworkId != null) entry(q.artworkId).inquiries++;

  const artworkRows = artworks
    .map((a) => {
      const e = byArtwork.get(a.id);
      const visitors = e?.visitors.size ?? 0;
      return {
        ...a,
        status: toStatus(a.status),
        theme: a.theme?.name ?? "Sans thème",
        views: e?.views ?? 0,
        visitors,
        avgSeconds: e?.timed ? e.seconds / e.timed : 0,
        inquiries: e?.inquiries ?? 0,
        conversion: visitors ? (e?.inquiries ?? 0) / visitors : 0,
      };
    })
    .sort((a, b) => b.views - a.views || b.inquiries - a.inquiries || a.title.localeCompare(b.title));

  // Thèmes : visites des fiches œuvres regroupées par thème
  const themeOf = new Map(artworkRows.map((a) => [a.id, a.theme]));
  const themes = visitsBy(
    views.filter((v) => v.artworkId != null),
    (v) => themeOf.get(v.artworkId!) ?? "Sans thème",
  );

  // Pistes d'amélioration (œuvres disponibles uniquement)
  const available = artworkRows.filter((a) => a.status === "DISPONIBLE");
  const viewed = available.filter((a) => a.views > 0).map((a) => a.views).sort((a, b) => a - b);
  const threshold = Math.max(3, viewed[Math.floor(viewed.length / 2)] ?? 0);
  const noInquiry = available.filter((a) => a.views >= threshold && a.inquiries === 0).slice(0, 5);
  const unseen = available.filter((a) => a.views === 0);

  // Pages
  const titleOf = new Map(artworks.map((a) => [`/oeuvres/${a.slug}`, a.title]));
  const pageLabel = (path: string) =>
    ({ "/": "Accueil", "/oeuvres": "Catalogue", "/contact": "Contact" })[path] ?? titleOf.get(path) ?? path;
  const pageCounts = new Map<string, number>();
  for (const v of views) pageCounts.set(v.path, (pageCounts.get(v.path) ?? 0) + 1);
  const pages = [...pageCounts]
    .map(([path, value]) => ({ label: pageLabel(path), path, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Heures d'affluence (heure de Paris)
  const hours = Array.from({ length: 24 }, () => 0);
  for (const v of views) hours[Number(hourOf.formatToParts(v.createdAt).find((p) => p.type === "hour")!.value)]++;

  return {
    days,
    current,
    previous,
    timeline,
    monthly,
    artworks: artworkRows,
    themes,
    sources: topWithOthers(visitsBy(views, (v) => v.source), 8),
    devices: visitsBy(views, (v) => v.device),
    pages,
    hours,
    noInquiry,
    unseen,
  };
}
