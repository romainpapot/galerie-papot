"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getDictionary } from "@/lib/dictionaries";
import { LOCALES, LOCALE_COOKIE, localePath, stripLocale, type Locale } from "@/lib/i18n";

export function Header({ lang }: { lang: Locale }) {
  const [open, setOpen] = useState(false);
  const path = stripLocale(usePathname());
  const t = getDictionary(lang).nav;

  const links = [
    { href: "/oeuvres", label: t.artworks },
    { href: "/#demarche", label: t.approach },
    { href: "/contact", label: t.contact },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href={localePath(lang, "/")} className="font-serif text-2xl tracking-wide" onClick={() => setOpen(false)}>
          Galerie Papot
        </Link>

        <div className="flex items-center gap-6 md:gap-8">
          <nav className="hidden gap-8 text-sm md:flex" aria-label={t.main}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={localePath(lang, l.href)}
                className={`tracking-wide transition-colors hover:text-ink ${
                  path.startsWith(l.href) && l.href !== "/#demarche" ? "text-ink" : "text-muted"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <LanguageSwitcher lang={lang} path={path} label={t.language} />

          <button
            type="button"
            className="-mr-2 p-2 md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? t.closeMenu : t.openMenu}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="block h-px w-6 bg-ink transition" style={{ transform: open ? "translateY(4px) rotate(45deg)" : "" }} />
            <span className="mt-2 block h-px w-6 bg-ink transition" style={{ transform: open ? "translateY(-5px) rotate(-45deg)" : "" }} />
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" className="border-t border-line md:hidden" aria-label={t.mobile}>
          <ul className="container-page flex flex-col py-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={localePath(lang, l.href)} className="block py-3 font-serif text-2xl" onClick={() => setOpen(false)}>
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

const LANGUAGE_NAMES: Record<Locale, string> = { fr: "Français", en: "English" };

/** Bascule FR / EN vers la même page ; le choix est mémorisé pour les visites suivantes. */
function LanguageSwitcher({ lang, path, label }: { lang: Locale; path: string; label: string }) {
  return (
    <ul className="flex items-center gap-1 text-xs tracking-widest uppercase" aria-label={label}>
      {LOCALES.map((l, i) => {
        // /fr/… est redirigé vers l'adresse sans préfixe en mémorisant le choix, même sans JavaScript
        const href = l === "fr" ? `/fr${path === "/" ? "" : path}` : localePath(l, path);
        return (
          <li key={l} className="flex items-center gap-1">
            {i > 0 && <span className="text-line" aria-hidden>/</span>}
            {l === lang ? (
              <span className="px-1 text-ink" aria-current="true" title={LANGUAGE_NAMES[l]}>
                {l}
              </span>
            ) : (
              <a
                href={href}
                hrefLang={l}
                lang={l}
                title={LANGUAGE_NAMES[l]}
                className="px-1 text-muted transition-colors hover:text-ink"
                onClick={(e) => {
                  e.preventDefault();
                  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
                  window.location.href = localePath(l, path) + window.location.search;
                }}
              >
                {l}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
