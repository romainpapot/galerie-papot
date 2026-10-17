"use client";

import { useTransition } from "react";
import { quickUpdateArtwork } from "@/app/admin/actions";
import { STATUSES, STATUS_LABELS, type ArtworkStatus } from "@/lib/status";

const COLORS: Record<ArtworkStatus, string> = {
  DISPONIBLE: "text-available border-available/30",
  RESERVE: "text-reserved border-reserved/40",
  VENDU: "text-sold border-line",
};

/** Sélecteur de statut et case « Nouveauté » enregistrés immédiatement. */
export function QuickStatus({ id, status, isNew }: { id: number; status: ArtworkStatus; isNew: boolean }) {
  const [pending, start] = useTransition();

  function save(field: "status" | "isNew", value: string) {
    const fd = new FormData();
    fd.set("id", String(id));
    fd.set(field, value);
    start(() => quickUpdateArtwork(fd));
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${pending ? "opacity-50" : ""}`}>
      <select
        aria-label="Statut"
        defaultValue={status}
        key={status}
        disabled={pending}
        onChange={(e) => save("status", e.target.value)}
        className={`rounded-full border bg-white px-3 py-1.5 text-xs font-medium tracking-wide uppercase ${COLORS[status]}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs text-muted">
        <input
          type="checkbox"
          className="size-4 accent-ink"
          defaultChecked={isNew}
          key={String(isNew)}
          disabled={pending}
          onChange={(e) => save("isNew", String(e.target.checked))}
        />
        Nouveauté
      </label>
    </div>
  );
}
