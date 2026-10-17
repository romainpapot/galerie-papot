import Link from "next/link";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";

export function Footer({ lang }: { lang: Locale }) {
  const t = getDictionary(lang);
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl text-ink">Galerie Papot</p>
          <p className="mt-1">{t.footer.tagline}</p>
        </div>
        <nav className="flex gap-6" aria-label={t.footer.label}>
          <Link href={localePath(lang, "/oeuvres")} className="hover:text-ink">{t.nav.artworks}</Link>
          <Link href={localePath(lang, "/contact")} className="hover:text-ink">{t.nav.contact}</Link>
          <Link href="/admin" className="hover:text-ink">{t.footer.admin}</Link>
        </nav>
        <p>© {new Date().getFullYear()} Galerie Papot</p>
      </div>
    </footer>
  );
}
