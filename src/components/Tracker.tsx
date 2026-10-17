"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Provenance mémorisée à l'arrivée sur le site : les navigations internes
// suivantes restent attribuées à la même source.
let entry: { referrer: string; utm: string } | null = null;

function send(body: object) {
  const data = JSON.stringify(body);
  if (!navigator.sendBeacon?.("/api/track", new Blob([data], { type: "text/plain" }))) {
    fetch("/api/track", { method: "POST", body: data, keepalive: true }).catch(() => {});
  }
}

function newId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Mesure d'audience sans cookie : une page vue par changement d'URL, puis le temps passé. */
export function Tracker() {
  const pathname = usePathname();
  const current = useRef<{ path: string; id: string } | null>(null);

  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === "1") return;

    entry ??= {
      referrer: document.referrer,
      utm: new URLSearchParams(location.search).get("utm_source") ?? "",
    };
    // Le ref évite un double comptage quand React rejoue l'effet (mode strict)
    if (current.current?.path !== pathname) {
      current.current = { path: pathname, id: newId() };
      send({ type: "view", id: current.current.id, path: pathname, ...entry });
    }
    const id = current.current.id;

    // Seul le temps où l'onglet est visible est compté
    let visibleMs = 0;
    let since: number | null = document.visibilityState === "visible" ? Date.now() : null;
    const flush = () => {
      if (since !== null) visibleMs += Date.now() - since;
      since = null;
      send({ type: "duration", id, seconds: Math.round(visibleMs / 1000) });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
      else since = Date.now();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, [pathname]);

  return null;
}
