import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-serif text-3xl">Galerie Papot</Link>
        <p className="mt-1 mb-10 text-sm text-muted">Espace galeriste</p>
        <LoginForm />
      </div>
    </div>
  );
}
