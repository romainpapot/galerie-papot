"use client";

import type { ArtworkStatus } from "@/lib/status";
import { useDictionary } from "./DictionaryProvider";

const STYLES: Record<ArtworkStatus, string> = {
  DISPONIBLE: "bg-white/90 text-available ring-available/30",
  RESERVE: "bg-white/90 text-reserved ring-reserved/40",
  VENDU: "bg-ink/80 text-white ring-transparent",
};

const DOTS: Record<ArtworkStatus, string> = {
  DISPONIBLE: "bg-available",
  RESERVE: "bg-reserved",
  VENDU: "bg-white/70",
};

export function StatusBadge({ status, className = "" }: { status: ArtworkStatus; className?: string }) {
  const t = useDictionary();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase ring-1 backdrop-blur ${STYLES[status]} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${DOTS[status]}`} aria-hidden />
      {t.status[status]}
    </span>
  );
}
