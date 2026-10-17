import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { getDictionary } from "./dictionaries";
import { isLocale, type Locale } from "./i18n";

/** Langue de la page en cours (segment app/[lang]), pour les composants serveur du site. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Langue et dictionnaire de la page en cours. */
export async function getTranslations() {
  const locale = await getLocale();
  return { lang: locale, t: getDictionary(locale) };
}
