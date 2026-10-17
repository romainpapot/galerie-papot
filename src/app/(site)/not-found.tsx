import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <p className="font-serif text-6xl">Introuvable</p>
      <p className="mt-4 text-muted">Cette page ou cette œuvre n&apos;existe pas (ou plus).</p>
      <Link href="/oeuvres" className="btn btn-primary mt-8">Voir les œuvres</Link>
    </div>
  );
}
