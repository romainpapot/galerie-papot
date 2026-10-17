import { notFound } from "next/navigation";

// Adresse inconnue du back-office : page 404 dans le layout admin
export default function UnknownAdminPage() {
  notFound();
}
