"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ArtworkCardData } from "@/lib/artworks";
import { plural } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { ArtworkStatus } from "@/lib/status";
import { ArtworkCard } from "./ArtworkCard";
import { useDictionary } from "./DictionaryProvider";

type Props = {
  artworks: ArtworkCardData[];
  themes: { name: string; slug: string }[];
  artists: { name: string; slug: string }[];
  lang: Locale;
};

/** Filtrage instantané côté client, synchronisé avec l'URL (?theme=…&artiste=…). */
export function Catalogue({ artworks, themes, artists, lang }: Props) {
  const t = useDictionary().catalogue;
  const availability: { value: "" | ArtworkStatus; label: string }[] = [
    { value: "", label: t.all },
    { value: "DISPONIBLE", label: t.available },
  ];
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [theme, setTheme] = useState(params.get("theme") ?? "");
  const [artist, setArtist] = useState(params.get("artiste") ?? "");
  const [status, setStatus] = useState(params.get("dispo") === "1" ? "DISPONIBLE" : "");

  function update(next: { theme?: string; artist?: string; status?: string }) {
    const t = next.theme ?? theme;
    const ar = next.artist ?? artist;
    const s = next.status ?? status;
    setTheme(t);
    setArtist(ar);
    setStatus(s);
    const q = new URLSearchParams();
    if (t) q.set("theme", t);
    if (ar) q.set("artiste", ar);
    if (s) q.set("dispo", "1");
    router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const visible = useMemo(
    () =>
      artworks.filter(
        (a) =>
          (!theme || a.theme?.slug === theme) &&
          (!artist || a.artistSlug === artist) &&
          (!status || a.status === status),
      ),
    [artworks, theme, artist, status],
  );

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
      active ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink hover:border-ink/40"
    }`;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 mb-8 border-b border-line/70 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="-my-1 flex gap-2 overflow-x-auto py-1 [scrollbar-width:none]" role="group" aria-label={t.filterByTheme}>
            <button type="button" className={chip(!theme)} aria-pressed={!theme} onClick={() => update({ theme: "" })}>
              {t.allThemes}
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
          {artists.length > 0 && (
            <label className="hidden shrink-0 lg:block">
              <span className="sr-only">{t.filterByArtist}</span>
              <ArtistSelect artists={artists} value={artist} allLabel={t.allArtists} onChange={(v) => update({ artist: v })} />
            </label>
          )}
          <label className="hidden shrink-0 items-center gap-2 text-sm text-muted sm:flex">
            <input
              type="checkbox"
              className="size-4 accent-ink"
              checked={status === "DISPONIBLE"}
              onChange={(e) => update({ status: e.target.checked ? "DISPONIBLE" : "" })}
            />
            {t.availableOnly}
          </label>
        </div>
        <div className="flex items-center justify-between gap-4 lg:hidden">
          <div className="mt-2 flex gap-2 sm:hidden" role="group" aria-label={t.availability}>
            {availability.map((o) => (
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
          {artists.length > 0 && (
            <label className="mt-2 ml-auto block">
              <span className="sr-only">{t.filterByArtist}</span>
              <ArtistSelect artists={artists} value={artist} allLabel={t.allArtists} onChange={(v) => update({ artist: v })} />
            </label>
          )}
        </div>
      </div>

      <p className="mb-6 text-sm text-muted" aria-live="polite">
        {plural(visible.length, t.countOne, t.countMany)}
      </p>

      {visible.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((a, i) => (
            <ArtworkCard key={a.id} artwork={a} lang={lang} priority={i < 4} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-muted">{t.empty}</p>
      )}
    </>
  );
}

function ArtistSelect({
  artists,
  value,
  allLabel,
  onChange,
}: {
  artists: { name: string; slug: string }[];
  value: string;
  allLabel: string;
  onChange: (slug: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`max-w-48 rounded-full border bg-white py-1.5 pr-8 pl-3 text-sm ${value ? "border-ink" : "border-line"}`}
    >
      <option value="">{allLabel}</option>
      {artists.map((a) => (
        <option key={a.slug} value={a.slug}>{a.name}</option>
      ))}
    </select>
  );
}
