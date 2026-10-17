import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { prisma } from "@/lib/prisma";
import { createArtwork } from "../../../actions";

export const metadata = { title: "Nouvelle œuvre" };

export default async function NewArtwork() {
  const themes = await prisma.theme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Nouvelle œuvre</h1>
      <ArtworkForm action={createArtwork} themes={themes} />
    </div>
  );
}
