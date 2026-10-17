export const STATUSES = ["DISPONIBLE", "RESERVE", "VENDU"] as const;
export type ArtworkStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<ArtworkStatus, string> = {
  DISPONIBLE: "Disponible",
  RESERVE: "Réservé",
  VENDU: "Vendu",
};

export function isStatus(value: unknown): value is ArtworkStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function toStatus(value: string): ArtworkStatus {
  return isStatus(value) ? value : "DISPONIBLE";
}
