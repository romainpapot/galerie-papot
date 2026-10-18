import { ArtworkForm } from "@/components/admin/ArtworkForm";
import { createArtwork } from "../../../actions";
import { artworkFormChoices } from "../choices";

export const metadata = { title: "Nouvelle œuvre" };

export default async function NewArtwork() {
  const choices = await artworkFormChoices();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl">Nouvelle œuvre</h1>
      <ArtworkForm action={createArtwork} {...choices} />
    </div>
  );
}
