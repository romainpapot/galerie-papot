import Link from "next/link";
import type { ArtworkStatus } from "@/lib/status";

/** Bouton de contact conditionné par le statut de l'œuvre. */
export function ArtworkAction({ id, status }: { id: number; status: ArtworkStatus }) {
  switch (status) {
    case "DISPONIBLE":
      return (
        <Link href={`/contact?oeuvre=${id}`} className="btn btn-primary w-full sm:w-auto">
          Se positionner / Contacter la galerie
        </Link>
      );

    case "RESERVE":
      return (
        <div className="space-y-3">
          <button type="button" disabled className="btn btn-primary w-full sm:w-auto">
            Actuellement réservé
          </button>
          <p className="text-sm text-muted">
            Une option est en cours sur cette œuvre.{" "}
            <Link href={`/contact?oeuvre=${id}&objet=attente`} className="text-ink underline underline-offset-4">
              Être placé en liste d&apos;attente
            </Link>
          </p>
        </div>
      );

    case "VENDU":
      return (
        <div className="space-y-3">
          <p className="font-serif text-2xl italic">Œuvre vendue</p>
          <p className="text-sm text-muted">
            Cette œuvre a trouvé sa place chez un collectionneur.{" "}
            <Link href={`/contact?oeuvre=${id}&objet=similaire`} className="text-ink underline underline-offset-4">
              Demander une réédition ou une œuvre dans le même esprit
            </Link>
          </p>
        </div>
      );
  }
}
