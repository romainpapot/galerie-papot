import { NewOptionForm, OptionRow } from "@/components/admin/OptionForms";
import { OPTION_INFO, OPTION_KINDS, compareNames } from "@/lib/options";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Listes" };

export default async function AdminLists() {
  const options = await prisma.listOption.findMany({
    include: { _count: { select: { mediumOf: true, supportOf: true, dimensionsOf: true } } },
  });
  options.sort(compareNames);

  return (
    <div className="max-w-4xl space-y-10">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl">Listes</h1>
        <p className="text-sm text-muted">
          Valeurs proposées dans le formulaire d&apos;œuvre, pour que chaque œuvre soit décrite avec les mêmes mots.
          Renommer une valeur met à jour toutes les œuvres qui l&apos;utilisent.
        </p>
      </div>
      {OPTION_KINDS.map((kind) => {
        const rows = options.filter((o) => o.kind === kind);
        return (
          <section key={kind} id={kind.toLowerCase()} className="space-y-4">
            <h2 className="font-serif text-2xl">{OPTION_INFO[kind].label}</h2>
            <NewOptionForm kind={kind} />
            {rows.length ? (
              <ul className="divide-y divide-line rounded-lg border border-line bg-white">
                {rows.map((o) => (
                  <OptionRow
                    key={`${o.id}-${o.name}-${o.nameEn}`}
                    kind={kind}
                    option={{
                      id: o.id,
                      name: o.name,
                      nameEn: o.nameEn,
                      count: o._count.mediumOf + o._count.supportOf + o._count.dimensionsOf,
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-muted">Aucune valeur pour le moment.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
