/**
 * Langues du site. Le français est servi sans préfixe (/oeuvres), l'anglais
 * sous /en (/en/oeuvres) ; src/proxy.ts fait la correspondance avec app/[lang].
 */
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie mémorisant le choix fait avec le sélecteur de langue. */
export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Adresse publique d'une page du site dans une langue : localePath("en", "/oeuvres") → "/en/oeuvres". */
export function localePath(lang: Locale, path: string) {
  if (lang === DEFAULT_LOCALE) return path;
  // Accueil, éventuellement suivi d'une ancre ou de paramètres : "/#demarche" → "/en#demarche"
  if (path === "/" || /^\/[#?]/.test(path)) return `/${lang}${path.slice(1)}`;
  return `/${lang}${path}`;
}

/** Retire le préfixe de langue d'une adresse : "/en/oeuvres" → "/oeuvres". */
export function stripLocale(path: string) {
  const match = /^\/(fr|en)(?=\/|$)/.exec(path);
  return match ? path.slice(match[0].length) || "/" : path;
}

/** Langue d'une adresse publique (celle vue par le visiteur). */
export function localeOfPath(path: string): Locale {
  return /^\/en(\/|$)/.test(path) ? "en" : DEFAULT_LOCALE;
}

/** Texte traduit d'un contenu du catalogue, avec repli sur le français s'il est vide. */
export function pick(lang: Locale, fr: string, en: string | null | undefined) {
  return lang === "en" && en?.trim() ? en : fr;
}

/** Liens hreflang et adresse canonique d'une page présente dans les deux langues. */
export function alternates(lang: Locale, path: string) {
  return {
    canonical: localePath(lang, path),
    languages: {
      fr: localePath("fr", path),
      en: localePath("en", path),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}
