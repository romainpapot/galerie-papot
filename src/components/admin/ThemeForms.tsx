"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { createTheme, deleteTheme, updateTheme, type FormState } from "@/app/admin/actions";

export function NewThemeForm() {
  const [state, action, pending] = useActionState(createTheme, {} as FormState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error) form.current?.reset();
  }, [pending, state]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="new-theme" className="sr-only">Nom du thème</label>
        <input id="new-theme" name="name" className="field" placeholder="Nouveau thème (ex. : Paysages)" required />
        {state.error && <p className="mt-1.5 text-sm text-red-700">{state.error}</p>}
      </div>
      <button className="btn btn-primary" disabled={pending}>Ajouter</button>
    </form>
  );
}

export function ThemeRow({ theme }: { theme: { id: number; name: string; slug: string; count: number } }) {
  const [updState, update, updating] = useActionState(updateTheme, {} as FormState);
  const [delState, remove, deleting] = useActionState(deleteTheme, {} as FormState);
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
          <input type="hidden" name="id" value={theme.id} />
          <label className="flex-1">
            <span className="sr-only">Nom</span>
            <input name="name" defaultValue={theme.name} className="field" required />
          </label>
          <label className="flex items-center gap-1 text-sm text-muted sm:w-56">
            <span className="shrink-0">/oeuvres?theme=</span>
            <input name="slug" defaultValue={theme.slug} className="field !px-2 !py-2" aria-label="Adresse (slug)" />
          </label>
          <button className="btn btn-outline !py-2" disabled={updating}>
            {updating ? "…" : "Renommer"}
          </button>
        </form>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className="text-sm text-muted">
            {theme.count} œuvre{theme.count > 1 ? "s" : ""}
          </span>
          <form
            action={remove}
            onSubmit={(e) => {
              if (!window.confirm(`Supprimer le thème « ${theme.name} » ?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={theme.id} />
            <button className="text-sm text-red-700 hover:underline disabled:opacity-50" disabled={deleting || theme.count > 0} title={theme.count > 0 ? "Réaffectez d'abord les œuvres de ce thème" : undefined}>
              Supprimer
            </button>
          </form>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
