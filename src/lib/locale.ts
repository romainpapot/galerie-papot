import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, type Locale } from "./i18n";
import { getSiteDictionary } from "./site-texts";

/** Langue de la page en cours (segment app/[lang]), pour les composants serveur du site. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Langue et textes de la page en cours (avec les modifications du back-office). */
export async function getTranslations() {
  const locale = await getLocale();
  return { lang: locale, t: await getSiteDictionary(locale) };
}
