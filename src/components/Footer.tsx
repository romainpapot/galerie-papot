import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-xl text-ink">Galerie Papot</p>
          <p className="mt-1">Peintures originales · Pièces uniques</p>
        </div>
        <nav className="flex gap-6" aria-label="Pied de page">
          <Link href="/oeuvres" className="hover:text-ink">Œuvres</Link>
          <Link href="/contact" className="hover:text-ink">Contact</Link>
          <Link href="/admin" className="hover:text-ink">Espace galeriste</Link>
        </nav>
        <p>© {new Date().getFullYear()} Galerie Papot</p>
      </div>
    </footer>
  );
}
