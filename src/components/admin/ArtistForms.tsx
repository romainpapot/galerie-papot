"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { createArtist, deleteArtist, updateArtist, type FormState } from "@/app/admin/actions";

export function NewArtistForm() {
  const [state, action, pending] = useActionState(createArtist, {} as FormState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error) form.current?.reset();
  }, [pending, state]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="new-artist" className="sr-only">Nom de l&apos;artiste</label>
        <input id="new-artist" name="name" className="field" placeholder="Nouvel artiste (prénom et nom)" required />
        {state.error && <p className="mt-1.5 text-sm text-red-700">{state.error}</p>}
      </div>
      <button className="btn btn-primary" disabled={pending}>Ajouter</button>
    </form>
  );
}

type ArtistData = { id: number; name: string; slug: string; photoUrl: string; bio: string; bioEn: string; count: number };

export function ArtistRow({ artist }: { artist: ArtistData }) {
  const [updState, update, updating] = useActionState(updateArtist, {} as FormState);
  const [delState, remove, deleting] = useActionState(deleteArtist, {} as FormState);
  const error = updState.error ?? delState.error;

  return (
    <li className="p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => update(data));
        }}
        className="grid gap-4 sm:grid-cols-[8rem_1fr]"
      >
        <input type="hidden" name="id" value={artist.id} />
        <div className="space-y-2">
          <div className="relative aspect-[4/5] w-32 overflow-hidden rounded-sm bg-line">
            {artist.photoUrl ? (
              <Image src={artist.photoUrl} alt={artist.name} fill sizes="128px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 grid place-items-center px-2 text-center text-xs text-muted">Pas de photo</span>
            )}
          </div>
          <label className="block text-xs text-muted">
            {artist.photoUrl ? "Changer la photo" : "Ajouter une photo"}
            <input name="photo" type="file" accept="image/*" className="mt-1 block w-32 text-xs" />
          </label>
          {artist.photoUrl && (
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input type="checkbox" name="removePhoto" className="accent-ink" /> Retirer la photo
            </label>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex-1">
              <span className="sr-only">Nom</span>
              <input name="name" defaultValue={artist.name} className="field" required />
            </label>
            <label className="flex items-center gap-1 text-sm text-muted sm:w-64">
              <span className="shrink-0">/oeuvres?artiste=</span>
              <input name="slug" defaultValue={artist.slug} className="field !px-2 !py-2" aria-label="Adresse (slug)" />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="label">Présentation</span>
              <textarea name="bio" defaultValue={artist.bio} rows={4} className="field resize-y" />
            </label>
            <label className="block">
              <span className="label">Présentation (anglais)</span>
              <textarea name="bioEn" defaultValue={artist.bioEn} rows={4} className="field resize-y" placeholder="Facultatif" />
            </label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <button className="btn btn-outline !py-2" disabled={updating}>
              {updating ? "Enregistrement…" : "Enregistrer"}
            </button>
            <span className="text-sm text-muted">
              {artist.count} œuvre{artist.count > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </form>
      <form
        action={remove}
        className="mt-3 text-right"
        onSubmit={(e) => {
          if (!window.confirm(`Supprimer l'artiste « ${artist.name} » ?`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={artist.id} />
        <button className="text-sm text-red-700 hover:underline disabled:opacity-50" disabled={deleting || artist.count > 0} title={artist.count > 0 ? "Réaffectez d'abord les œuvres de cet artiste" : undefined}>
          Supprimer
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
