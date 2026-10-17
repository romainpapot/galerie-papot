"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/oeuvres", label: "Œuvres" },
  { href: "/#demarche", label: "Démarche" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-wide" onClick={() => setOpen(false)}>
          Galerie Papot
        </Link>

        <nav className="hidden gap-8 text-sm md:flex" aria-label="Navigation principale">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`tracking-wide transition-colors hover:text-ink ${
                pathname.startsWith(l.href) && l.href !== "/#demarche" ? "text-ink" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="-mr-2 p-2 md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="block h-px w-6 bg-ink transition" style={{ transform: open ? "translateY(4px) rotate(45deg)" : "" }} />
          <span className="mt-2 block h-px w-6 bg-ink transition" style={{ transform: open ? "translateY(-5px) rotate(-45deg)" : "" }} />
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className="border-t border-line md:hidden" aria-label="Navigation mobile">
          <ul className="container-page flex flex-col py-4">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-3 font-serif text-2xl" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
