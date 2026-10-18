"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  const links = [
    { href: "/admin", label: "Tableau de bord", exact: true },
    { href: "/admin/statistiques", label: "Statistiques" },
    { href: "/admin/oeuvres", label: "Œuvres" },
    { href: "/admin/artistes", label: "Artistes" },
    { href: "/admin/themes", label: "Thèmes" },
    { href: "/admin/listes", label: "Listes" },
    { href: "/admin/demandes", label: "Demandes", badge: unread },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto text-sm [scrollbar-width:none]">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 transition-colors ${
              active ? "bg-ink text-paper" : "text-muted hover:bg-line/60 hover:text-ink"
            }`}
          >
            {l.label}
            {!!l.badge && (
              <span className={`rounded-full px-1.5 text-xs ${active ? "bg-paper text-ink" : "bg-ink text-paper"}`}>
                {l.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
