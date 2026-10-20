"use client";

import { createContext, useContext } from "react";
import { getDictionary, type Dictionary } from "@/lib/dictionaries";

const DictionaryContext = createContext<Dictionary | null>(null);

/** Transmet aux composants client les textes du site (modifiables en back-office). */
export function DictionaryProvider({ value, children }: { value: Dictionary; children: React.ReactNode }) {
  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

/** Textes du site ; hors du site public (back-office), textes français par défaut. */
export function useDictionary() {
  return useContext(DictionaryContext) ?? getDictionary("fr");
}
