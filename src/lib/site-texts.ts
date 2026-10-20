import "server-only";
import { cache } from "react";
import { getDictionary, type Dictionary, type TextKey } from "./dictionaries";
import type { Locale } from "./i18n";
import { prisma } from "./prisma";

/** Textes modifiés en back-office (une requête par rendu). */
export const loadSiteTexts = cache(() => prisma.siteText.findMany());

/** Valeur par défaut d'un texte. */
export function defaultText(lang: Locale, key: TextKey): string {
  let node: unknown = getDictionary(lang);
  for (const part of key.split(".")) node = (node as Record<string, unknown>)[part];
  return node as string;
}

/** Toutes les clés de texte, dans l'ordre du dictionnaire. */
export function textKeys(): TextKey[] {
  const keys: string[] = [];
  const walk = (node: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string") keys.push(prefix + k);
      else walk(v as Record<string, unknown>, `${prefix}${k}.`);
    }
  };
  walk(getDictionary("fr"), "");
  return keys as TextKey[];
}

/** Dictionnaire de la langue demandée, avec les textes modifiés en back-office. */
export async function getSiteDictionary(lang: Locale): Promise<Dictionary> {
  const dict = structuredClone(getDictionary(lang));
  for (const row of await loadSiteTexts()) {
    if (!row[lang].trim()) continue; // champ vide : texte par défaut
    const parts = row.key.split(".");
    const last = parts.pop()!;
    let node: unknown = dict;
    for (const part of parts) node = (node as Record<string, unknown> | undefined)?.[part];
    const parent = node as Record<string, unknown> | undefined;
    // Les anciennes clés qui n'existent plus dans le dictionnaire sont ignorées
    if (parent && typeof parent === "object" && typeof parent[last] === "string") parent[last] = row[lang];
  }
  return dict;
}
