import Link from "next/link";
import type { Dictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import type { ArtworkStatus } from "@/lib/status";

/** Bouton de contact conditionné par le statut de l'œuvre. */
export function ArtworkAction({
  id,
  status,
  lang,
  t,
}: {
  id: number;
  status: ArtworkStatus;
  lang: Locale;
  t: Dictionary["action"];
}) {
  const contact = (query: string) => localePath(lang, `/contact?${query}`);

  switch (status) {
    case "DISPONIBLE":
      return (
        <Link href={contact(`oeuvre=${id}`)} className="btn btn-primary w-full sm:w-auto">
          {t.contact}
        </Link>
      );

    case "RESERVE":
      return (
        <div className="space-y-3">
          <button type="button" disabled className="btn btn-primary w-full sm:w-auto">
            {t.reserved}
          </button>
          <p className="text-sm text-muted">
            {t.reservedNote}{" "}
            <Link href={contact(`oeuvre=${id}&objet=attente`)} className="text-ink underline underline-offset-4">
              {t.waitlist}
            </Link>
          </p>
        </div>
      );

    case "VENDU":
      return (
        <div className="space-y-3">
          <p className="font-serif text-2xl italic">{t.sold}</p>
          <p className="text-sm text-muted">
            {t.soldNote}{" "}
            <Link href={contact(`oeuvre=${id}&objet=similaire`)} className="text-ink underline underline-offset-4">
              {t.similar}
            </Link>
          </p>
        </div>
      );
  }
}
