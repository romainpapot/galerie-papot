// Listes déroulantes du formulaire d'œuvre (table list_options), gérées dans le
// back-office. Le type est stocké en texte, comme le statut (SQLite sans enum).

export const OPTION_KINDS = ["MEDIUM", "SUPPORT", "DIMENSIONS"] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

export const OPTION_INFO: Record<
  OptionKind,
  { label: string; field: "mediumId" | "supportId" | "dimensionsId"; placeholder: string; placeholderEn?: string }
> = {
  MEDIUM: { label: "Type de peinture", field: "mediumId", placeholder: "Acrylique", placeholderEn: "Acrylic" },
  SUPPORT: { label: "Support", field: "supportId", placeholder: "Toile de lin", placeholderEn: "Linen canvas" },
  // Pas de traduction : « 80 × 100 cm » s'écrit de même en anglais
  DIMENSIONS: { label: "Dimensions", field: "dimensionsId", placeholder: "80 × 100 cm" },
};

export function isOptionKind(value: unknown): value is OptionKind {
  return OPTION_KINDS.includes(value as OptionKind);
}

/** Tri alphabétique tenant compte des nombres (« 40 × 50 cm » avant « 100 × 100 cm »). */
export function compareNames(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, "fr", { numeric: true, sensitivity: "base" });
}

/** Écriture uniforme des dimensions : « 80x100 » → « 80 × 100 cm ». */
export function normalizeDimensions(value: string) {
  const m = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:cm)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×*]\s*(\d+(?:[.,]\d+)?))?\s*(?:cm)?$/i);
  if (!m) return value.trim();
  const sizes = [m[1], m[2], m[3]].filter(Boolean).map((n) => n.replace(".", ","));
  return `${sizes.join(" × ")} cm`;
}
