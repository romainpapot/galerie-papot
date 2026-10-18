"use client";

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

export function ArtistRow({ artist }: { artist: { id: number; name: string; slug: string; count: number } }) {
  const [updState, update, updating] = useActionState(updateArtist, {} as FormState);
  const [delState, remove, deleting] = useActionState(deleteArtist, {} as FormState);
  const error = updState.error ?? delState.error;

  return (
    <li className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            startTransition(() => update(data));
          }}
          className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="id" value={artist.id} />
          <label className="flex-1">
            <span className="sr-only">Nom</span>
            <input name="name" defaultValue={artist.name} className="field" required />
          </label>
          <label className="flex items-center gap-1 text-sm text-muted sm:w-64">
            <span className="shrink-0">/oeuvres?artiste=</span>
            <input name="slug" defaultValue={artist.slug} className="field !px-2 !py-2" aria-label="Adresse (slug)" />
          </label>
          <button className="btn btn-outline !py-2" disabled={updating}>
            {updating ? "…" : "Renommer"}
          </button>
        </form>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className="text-sm text-muted">
            {artist.count} œuvre{artist.count > 1 ? "s" : ""}
          </span>
          <form
            action={remove}
            onSubmit={(e) => {
              if (!window.confirm(`Supprimer l'artiste « ${artist.name} » ?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={artist.id} />
            <button className="text-sm text-red-700 hover:underline disabled:opacity-50" disabled={deleting || artist.count > 0} title={artist.count > 0 ? "Réaffectez d'abord les œuvres de cet artiste" : undefined}>
              Supprimer
            </button>
          </form>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
