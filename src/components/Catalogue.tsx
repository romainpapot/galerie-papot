"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ArtworkCardData } from "@/lib/artworks";
import type { ArtworkStatus } from "@/lib/status";
import { ArtworkCard } from "./ArtworkCard";

type Props = {
  artworks: ArtworkCardData[];
  themes: { name: string; slug: string }[];
};

const AVAILABILITY: { value: "" | ArtworkStatus; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "DISPONIBLE", label: "Disponibles" },
];

/** Filtrage instantané côté client, synchronisé avec l'URL (?theme=…). */
export function Catalogue({ artworks, themes }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [theme, setTheme] = useState(params.get("theme") ?? "");
  const [status, setStatus] = useState(params.get("dispo") === "1" ? "DISPONIBLE" : "");

  function update(next: { theme?: string; status?: string }) {
    const t = next.theme ?? theme;
    const s = next.status ?? status;
    setTheme(t);
    setStatus(s);
    const q = new URLSearchParams();
    if (t) q.set("theme", t);
    if (s) q.set("dispo", "1");
    router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const visible = useMemo(
    () =>
      artworks.filter(
        (a) => (!theme || a.theme?.slug === theme) && (!status || a.status === status),
      ),
    [artworks, theme, status],
  );

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40"
    }`;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 mb-8 border-b border-line/70 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="-my-1 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none]" role="group" aria-label="Filtrer par thème">
            <button type="button" className={chip(!theme)} aria-pressed={!theme} onClick={() => update({ theme: "" })}>
              Tous les thèmes
            </button>
            {themes.map((t) => (
              <button
                key={t.slug}
                type="button"
                className={chip(theme === t.slug)}
                aria-pressed={theme === t.slug}
                onClick={() => update({ theme: t.slug })}
              >
                {t.name}
              </button>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-sm text-muted sm:flex">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={status === "DISPONIBLE"}
              onChange={(e) => update({ status: e.target.checked ? "DISPONIBLE" : "" })}
            />
            Disponibles uniquement
          </label>
        </div>
        <div className="mt-2 flex gap-2 sm:hidden" role="group" aria-label="Disponibilité">
          {AVAILABILITY.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`text-xs ${status === o.value ? "text-ink underline underline-offset-4" : "text-muted"}`}
              onClick={() => update({ status: o.value })}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-6 text-sm text-muted" aria-live="polite">
        {visible.length} œuvre{visible.length > 1 ? "s" : ""}
      </p>

      {visible.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((a, i) => (
            <ArtworkCard key={a.id} artwork={a} priority={i < 4} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-muted">Aucune œuvre ne correspond à ces critères.</p>
      )}
    </>
  );
}
