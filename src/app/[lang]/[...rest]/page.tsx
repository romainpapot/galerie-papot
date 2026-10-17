import { notFound } from "next/navigation";

// Toute adresse inconnue du site affiche la page 404 dans la bonne langue (app/[lang]/not-found.tsx)
export default function UnknownPage() {
  notFound();
}
