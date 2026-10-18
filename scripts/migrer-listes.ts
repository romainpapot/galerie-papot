/**
 * Reprend les anciens champs texte des œuvres (type de peinture, support,
 * dimensions) dans les listes du back-office et relie chaque œuvre à sa valeur.
 *
 *   npx prisma db push && npm run db:migrer-listes
 *
 * Sans risque à relancer : les œuvres déjà reliées ne sont pas modifiées, et les
 * valeurs identiques à la casse près (« acrylique » / « Acrylique ») sont fusionnées.
 */
import { PrismaClient } from "@prisma/client";
import { normalizeDimensions, type OptionKind } from "../src/lib/options";

const prisma = new PrismaClient();

const same = (a: string, b: string) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;

async function main() {
  const options = await prisma.listOption.findMany();
  let created = 0;

  async function optionId(kind: OptionKind, name: string, nameEn = "") {
    const existing = options.find((o) => o.kind === kind && same(o.name, name));
    if (existing) {
      if (!existing.nameEn && nameEn) {
        existing.nameEn = nameEn;
        await prisma.listOption.update({ where: { id: existing.id }, data: { nameEn } });
      }
      return existing.id;
    }
    const option = await prisma.listOption.create({ data: { kind, name, nameEn } });
    options.push(option);
    created++;
    return option.id;
  }

  const artworks = await prisma.artwork.findMany();
  let linked = 0;
  for (const a of artworks) {
    const data: { mediumId?: number; supportId?: number; dimensionsId?: number } = {};
    if (!a.mediumId && a.legacyMedium.trim()) {
      data.mediumId = await optionId("MEDIUM", a.legacyMedium.trim(), a.legacyMediumEn.trim());
    }
    if (!a.supportId && a.legacySupport.trim()) {
      data.supportId = await optionId("SUPPORT", a.legacySupport.trim(), a.legacySupportEn.trim());
    }
    if (!a.dimensionsId && a.legacyDimensions.trim()) {
      data.dimensionsId = await optionId("DIMENSIONS", normalizeDimensions(a.legacyDimensions));
    }
    if (Object.keys(data).length) {
      await prisma.artwork.update({ where: { id: a.id }, data });
      linked++;
    }
  }

  console.log(`✓ ${created} valeur(s) ajoutée(s) aux listes, ${linked} œuvre(s) reliée(s) sur ${artworks.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
