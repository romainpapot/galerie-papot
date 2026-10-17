const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number | null | undefined) {
  if (price == null) return "Prix sur demande";
  return priceFormatter.format(price);
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
