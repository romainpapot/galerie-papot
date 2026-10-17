import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const unread = await prisma.inquiry.count({ where: { isRead: false } });

  return (
    <div className="min-h-dvh bg-[#f4f2ee]">
      <header className="border-b border-line bg-paper">
        <div className="container-page flex h-14 items-center justify-between gap-4">
          <Link href="/admin" className="font-serif text-xl">
            Galerie Papot <span className="font-sans text-xs tracking-widest text-muted uppercase">admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" target="_blank" className="hidden text-muted hover:text-ink sm:inline">
              Voir le site ↗
            </Link>
            <form action={logout}>
              <button className="text-muted hover:text-ink" title={`Connecté : ${session.username}`}>
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <div className="container-page pb-3">
          <AdminNav unread={unread} />
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
