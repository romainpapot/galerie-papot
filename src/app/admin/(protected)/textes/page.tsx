import { SiteTextSection } from "@/components/admin/SiteTextForms";
import { prisma } from "@/lib/prisma";
import { defaultText, textKeys } from "@/lib/site-texts";
import { TEXT_LABELS, TEXT_SECTIONS } from "./sections";

export const metadata = { title: "Textes du site" };

export default async function AdminTexts() {
  const rows = await prisma.siteText.findMany();
  const saved = new Map(rows.map((r) => [r.key, r]));
  const keys = textKeys();

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-serif text-4xl">Textes du site</h1>
      <p className="text-sm text-muted">
        Tous les textes du site public, en français et en anglais, regroupés par page. Les mots entre accolades,
        comme <code>{"{n}"}</code>, sont remplacés automatiquement (nombre, nom, référence…) : gardez-les dans
        votre texte. Un champ vidé reprend le texte d&apos;origine.
      </p>
      <nav className="flex flex-wrap gap-2 text-sm">
        {TEXT_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line bg-white px-3 py-1 hover:border-ink/40">
            {s.title}
          </a>
        ))}
      </nav>
      {TEXT_SECTIONS.map((section) => (
        <SiteTextSection
          key={section.id}
          id={section.id}
          title={section.title}
          texts={keys
            .filter((k) => section.prefixes.some((p) => (p.endsWith(".") ? k.startsWith(p) : k === p)))
            .map((key) => {
              const row = saved.get(key);
              const fr = defaultText("fr", key);
              const en = defaultText("en", key);
              return {
                key,
                label: TEXT_LABELS[key],
                defaults: { fr, en },
                values: { fr: row?.fr || fr, en: row?.en || en },
              };
            })}
        />
      ))}
    </div>
  );
}
