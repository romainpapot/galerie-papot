import "server-only";
import { createHash } from "node:crypto";

/** Durée de conservation des visites (13 mois, recommandation CNIL). */
export const RETENTION_DAYS = 395;

/** Durée maximale retenue pour une page (au-delà, l'onglet a été oublié ouvert). */
export const MAX_DURATION = 30 * 60;

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|monitor|curl|wget|python/i;

export function isBot(userAgent: string) {
  return !userAgent || BOT.test(userAgent);
}

/**
 * Empreinte anonyme du visiteur : IP et navigateur hachés avec un sel qui change
 * chaque jour. Rien n'est stocké chez le visiteur et l'IP n'est jamais conservée ;
 * un même visiteur revenant un autre jour compte comme une nouvelle visite.
 */
export function visitorId(ip: string, userAgent: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET}|${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 16);
}

export function deviceFromUserAgent(userAgent: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "Tablette";
  if (/mobi|iphone|android/i.test(userAgent)) return "Mobile";
  return "Ordinateur";
}

const KNOWN_SOURCES: [RegExp, string][] = [
  [/^(mail\.google\.com|outlook\.live\.com|outlook\.office\.com)$|^(webmail|mail)\./, "Messagerie"],
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)qwant\.com$/, "Qwant"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X (Twitter)"],
];

/**
 * Provenance lisible d'une visite : paramètre `utm_source` s'il est présent
 * (liens de campagne, newsletter…), sinon le domaine du site d'origine.
 */
export function trafficSource(referrer: string, utmSource: string, siteHost: string) {
  const utm = utmSource.trim().slice(0, 60);
  if (utm) return utm.charAt(0).toUpperCase() + utm.slice(1);

  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Accès direct";
  }
  if (!host || host === siteHost.replace(/^www\./, "")) return "Accès direct";
  return KNOWN_SOURCES.find(([re]) => re.test(host))?.[1] ?? host;
}
