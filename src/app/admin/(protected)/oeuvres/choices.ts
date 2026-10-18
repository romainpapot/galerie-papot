import "server-only";
import { OPTION_KINDS, compareNames, type OptionKind } from "@/lib/options";
import { prisma } from "@/lib/prisma";

/** Choix proposés par les listes déroulantes du formulaire d'œuvre. */
export async function artworkFormChoices() {
  const [themes, artists, rows] = await Promise.all([
    prisma.theme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.artist.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.listOption.findMany({ select: { id: true, name: true, kind: true } }),
  ]);
  rows.sort(compareNames);
  const options = Object.fromEntries(
    OPTION_KINDS.map((k) => [k, rows.filter((o) => o.kind === k).map(({ id, name }) => ({ id, name }))]),
  ) as Record<OptionKind, { id: number; name: string }[]>;
  return { themes, artists, options };
}
