import { getDictionary } from "./dictionaries";
import type { Locale } from "./i18n";

const priceFormatters: Record<Locale, Intl.NumberFormat> = {
  fr: new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }),
};

/** Prix formaté ; `onRequest` : texte affiché sans prix (modifiable en back-office). */
export function formatPrice(
  price: number | null | undefined,
  lang: Locale = "fr",
  onRequest = getDictionary(lang).priceOnRequest,
) {
  if (price == null) return onRequest;
  return priceFormatters[lang].format(price);
}

/** Référence lisible d'une œuvre, utilisée dans les demandes de contact. */
export function artworkReference(id: number) {
  return `GP-${String(id).padStart(4, "0")}`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}
