"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { createOption, deleteOption, updateOption, type FormState } from "@/app/admin/actions";
import { OPTION_INFO, type OptionKind } from "@/lib/options";

export function NewOptionForm({ kind }: { kind: OptionKind }) {
  const [state, action, pending] = useActionState(createOption, {} as FormState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error) form.current?.reset();
  }, [pending, state]);
  const info = OPTION_INFO[kind];

  return (
    <form ref={form} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex-1">
        <label htmlFor={`new-${kind}`} className="sr-only">Nouvelle valeur</label>
        <input id={`new-${kind}`} name="name" className="field" placeholder={`Nouvelle valeur (ex. : ${info.placeholder})`} required />
        {state.error && <p className="mt-1.5 text-sm text-red-700">{state.error}</p>}
      </div>
      {info.placeholderEn && (
        <div className="flex-1">
          <label htmlFor={`new-${kind}-en`} className="sr-only">En anglais (facultatif)</label>
          <input id={`new-${kind}-en`} name="nameEn" lang="en" className="field" placeholder={`En anglais, facultatif (ex. : ${info.placeholderEn})`} />
        </div>
      )}
      <button className="btn btn-primary" disabled={pending}>Ajouter</button>
    </form>
  );
}

export function OptionRow({
  kind,
  option,
}: {
  kind: OptionKind;
  option: { id: number; name: string; nameEn: string; count: number };
}) {
  const [updState, update, updating] = useActionState(updateOption, {} as FormState);
  const [delState, remove, deleting] = useActionState(deleteOption, {} as FormState);
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
          <input type="hidden" name="id" value={option.id} />
          <input type="hidden" name="kind" value={kind} />
          <label className="flex-1">
            <span className="sr-only">Valeur</span>
            <input name="name" defaultValue={option.name} className="field" required />
          </label>
          {OPTION_INFO[kind].placeholderEn && (
            <label className="flex-1">
              <span className="sr-only">En anglais</span>
              <input name="nameEn" lang="en" defaultValue={option.nameEn} className="field" placeholder="En anglais" />
            </label>
          )}
          <button className="btn btn-outline !py-2" disabled={updating}>
            {updating ? "…" : "Renommer"}
          </button>
        </form>
        <div className="flex items-center justify-between gap-4 md:justify-end">
          <span className="text-sm text-muted">
            {option.count} œuvre{option.count > 1 ? "s" : ""}
          </span>
          <form
            action={remove}
            onSubmit={(e) => {
              if (!window.confirm(`Supprimer « ${option.name} » ?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={option.id} />
            <button className="text-sm text-red-700 hover:underline disabled:opacity-50" disabled={deleting || option.count > 0} title={option.count > 0 ? "Modifiez d'abord les œuvres qui utilisent cette valeur" : undefined}>
              Supprimer
            </button>
          </form>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
