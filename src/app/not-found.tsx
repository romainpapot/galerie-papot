import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="font-serif text-6xl">Introuvable</p>
      <p className="mt-4 text-muted">Cette page n&apos;existe pas (ou plus).</p>
      <Link href="/" className="btn btn-primary mt-8">Retour à l&apos;accueil</Link>
    </div>
  );
}
