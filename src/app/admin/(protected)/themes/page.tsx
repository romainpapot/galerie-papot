import { NewThemeForm, ThemeRow } from "@/components/admin/ThemeForms";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Thèmes" };

export default async function AdminThemes() {
  const themes = await prisma.theme.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { artworks: true } } },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-serif text-4xl">Thèmes</h1>
      <NewThemeForm />
      {themes.length ? (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {themes.map((t) => (
            <ThemeRow key={`${t.id}-${t.name}-${t.slug}`} theme={{ id: t.id, name: t.name, slug: t.slug, count: t._count.artworks }} />
          ))}
        </ul>
      ) : (
        <p className="text-muted">Aucun thème pour le moment.</p>
      )}
    </div>
  );
}
