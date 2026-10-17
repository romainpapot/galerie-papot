/* Graphiques du tableau de bord des statistiques : HTML + CSS, sans librairie. */

const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 });

export const formatNumber = (n: number) => number.format(n);
export const formatPercent = (n: number) => percent.format(n);

export function formatDuration(seconds: number) {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return s % 60 ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${m} min`;
}

/** Indicateur clé avec évolution par rapport à la période précédente. */
export function Kpi({
  label,
  value,
  current,
  previous,
  lowerIsBetter,
  hint,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  lowerIsBetter?: boolean;
  hint?: string;
}) {
  let delta: React.ReactNode = <span className="text-muted">—</span>;
  if (previous > 0) {
    const change = (current - previous) / previous;
    const good = lowerIsBetter ? change < 0 : change > 0;
    delta =
      Math.abs(change) < 0.005 ? (
        <span className="text-muted">= stable</span>
      ) : (
        <span className={good ? "text-available" : "text-red-700"}>
          {change > 0 ? "▲" : "▼"} {percent.format(Math.abs(change))}
        </span>
      );
  } else if (current > 0) {
    delta = <span className="text-muted">nouveau</span>;
  }

  return (
    <div className="rounded-lg border border-line bg-white p-5" title={hint}>
      <p className="font-serif text-4xl">{value}</p>
      <p className="mt-1 text-xs tracking-wider text-muted uppercase">{label}</p>
      <p className="mt-3 text-xs">{delta}</p>
    </div>
  );
}

export function Panel({ title, note, children, className = "" }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-line bg-white p-5 ${className}`}>
      <h2 className="text-sm font-medium tracking-wider text-muted uppercase">{title}</h2>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Histogramme vertical (une seule série) avec infobulle au survol. */
export function ColumnChart({
  data,
  unit,
  ticks = 3,
}: {
  data: { label: string; short: string; value: number }[];
  unit: string;
  ticks?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = Math.max(1, Math.floor((data.length - 1) / (ticks - 1)));
  const showTick = (i: number) => (i % step === 0 && data.length - 1 - i >= step) || i === data.length - 1;

  return (
    <figure>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" aria-hidden>
          <span className="absolute -top-2.5 right-0 bg-white pl-1 text-[11px] text-muted">{formatNumber(max)}</span>
        </div>
        <div className="flex h-40 items-end gap-[2px] border-b border-line pt-1" role="img" aria-label={`Histogramme : ${unit}`}>
          {data.map((d) => (
            <div key={d.label} className="group relative flex h-full min-w-0 flex-1 items-end hover:bg-line/40">
              <div
                className="w-full rounded-t-[4px] bg-ink/75 group-hover:bg-ink"
                style={{ height: d.value ? `${(d.value / max) * 100}%` : 0, minHeight: d.value ? 2 : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded bg-ink px-2 py-1 text-xs whitespace-nowrap text-paper group-hover:block">
                {d.label} · <strong>{formatNumber(d.value)}</strong> {unit}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[11px] text-muted" aria-hidden>
        {data.map((d, i) => (
          <div key={d.label} className="relative min-w-0 flex-1">
            {showTick(i) && <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">{d.short}</span>}
          </div>
        ))}
      </div>
      <details className="mt-6 text-xs text-muted">
        <summary className="cursor-pointer hover:text-ink">Voir les données</summary>
        <table className="mt-2 w-full max-w-sm">
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-line/60">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right tabular-nums text-ink">{formatNumber(d.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/** Classement en barres horizontales, valeur et part affichées en clair. */
export function BarList({ rows, empty = "Pas encore de données." }: { rows: { label: string; value: number; href?: string }[]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate">
              {r.href ? (
                <a href={r.href} target="_blank" className="hover:underline">{r.label}</a>
              ) : (
                r.label
              )}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatNumber(r.value)} <span className="text-xs text-muted">· {percent.format(r.value / total)}</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-line/50">
            <div className="h-full rounded-full bg-ink/75" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
