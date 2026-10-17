"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { STATUSES, STATUS_LABELS, type ArtworkStatus } from "@/lib/status";

export type ArtworkFormValues = {
  title: string;
  description: string;
  medium: string;
  support: string;
  titleEn: string;
  descriptionEn: string;
  mediumEn: string;
  supportEn: string;
  dimensions: string;
  price: number | null;
  themeId: number | null;
  status: ArtworkStatus;
  isNew: boolean;
  imageUrl: string;
  images: { id: number; url: string }[];
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  themes: { id: number; name: string }[];
  initial?: ArtworkFormValues;
};

const STATUS_HELP: Record<ArtworkStatus, string> = {
  DISPONIBLE: "Affichée normalement, le formulaire de contact est actif.",
  RESERVE: "Badge « Réservé » : une option est en cours.",
  VENDU: "Badge « Vendu », visuel légèrement grisé, conservée en archive.",
};

export function ArtworkForm({ action, themes, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [preview, setPreview] = useState<string | null>(null);
  const errors = state.fieldErrors ?? {};
  const mainImage = preview ?? initial?.imageUrl;

  return (
    <form
      // Soumission manuelle : évite la réinitialisation automatique du
      // formulaire par React, pour conserver la saisie en cas d'erreur.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="grid gap-8 lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-6 rounded-lg border border-line bg-white p-5 sm:p-8">
        <Text name="title" label="Titre" required defaultValue={initial?.title} error={errors.title} />

        <div>
          <label htmlFor="description" className="label">Description / note d&apos;intention</label>
          <textarea id="description" name="description" rows={6} className="field" defaultValue={initial?.description} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Text name="medium" label="Type de peinture" placeholder="Acrylique, huile…" defaultValue={initial?.medium} />
          <Text name="support" label="Support" placeholder="Toile de lin, papier…" defaultValue={initial?.support} />
          <Text name="dimensions" label="Dimensions" placeholder="80 × 100 cm" defaultValue={initial?.dimensions} />
          <Text
            name="price"
            label="Prix (€)"
            inputMode="decimal"
            placeholder="Vide = prix sur demande"
            defaultValue={initial?.price ?? ""}
            error={errors.price}
          />
        </div>

        <div>
          <label htmlFor="themeId" className="label">Thème</label>
          <select id="themeId" name="themeId" className="field" defaultValue={initial?.themeId ?? ""}>
            <option value="">— Sans thème —</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {themes.length === 0 && (
            <p className="mt-1.5 text-sm text-muted">
              Aucun thème : <Link href="/admin/themes" className="underline">créez-en un</Link>.
            </p>
          )}
        </div>

        <fieldset className="space-y-6 rounded-lg border border-line p-4 sm:p-5">
          <legend className="px-2 text-sm font-medium">
            Version anglaise <span className="font-normal text-muted">· facultatif</span>
          </legend>
          <p className="-mt-2 text-xs text-muted">
            Affichée sur le site en anglais (/en). Un champ laissé vide y est remplacé par sa version française.
          </p>
          <Text name="titleEn" label="Titre (anglais)" lang="en" defaultValue={initial?.titleEn} />
          <div>
            <label htmlFor="descriptionEn" className="label">Description / note d&apos;intention (anglais)</label>
            <textarea id="descriptionEn" name="descriptionEn" lang="en" rows={6} className="field" defaultValue={initial?.descriptionEn} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Text name="mediumEn" label="Type de peinture (anglais)" lang="en" placeholder="Acrylic, oil…" defaultValue={initial?.mediumEn} />
            <Text name="supportEn" label="Support (anglais)" lang="en" placeholder="Linen canvas, paper…" defaultValue={initial?.supportEn} />
          </div>
        </fieldset>

        <div>
          <p className="label">Images supplémentaires</p>
          {!!initial?.images.length && (
            <div className="mb-3 flex flex-wrap gap-3">
              {initial.images.map((img) => (
                <label key={img.id} className="group relative block size-24 cursor-pointer overflow-hidden rounded bg-line">
                  <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1.5 py-1 text-[11px] text-white">
                    <input type="checkbox" name="removeImage" value={img.id} className="accent-red-600" /> Retirer
                  </span>
                </label>
              ))}
            </div>
          )}
          <input type="file" name="extraImages" accept="image/*" multiple className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-line file:px-4 file:py-2 file:text-sm" />
          <p className="mt-1.5 text-xs text-muted">Détails, vue de biais, mise en situation… (JPEG, PNG ou WebP, 20 Mo max chacune)</p>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-lg border border-line bg-white p-5">
          <p className="label">Statut</p>
          <div className="space-y-2">
            {STATUSES.map((s) => (
              <label key={s} className="flex cursor-pointer gap-3 rounded-lg border border-line p-3 has-checked:border-ink">
                <input type="radio" name="status" value={s} defaultChecked={(initial?.status ?? "DISPONIBLE") === s} className="mt-1 accent-ink" />
                <span>
                  <span className="block text-sm font-medium">{STATUS_LABELS[s]}</span>
                  <span className="block text-xs text-muted">{STATUS_HELP[s]}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="isNew" defaultChecked={initial?.isNew ?? true} className="size-4 accent-ink" />
            Mettre en avant dans les Nouveautés
          </label>
        </div>

        <div className="rounded-lg border border-line bg-white p-5">
          <label htmlFor="image" className="label">Image principale{!initial && " *"}</label>
          {mainImage && (
            <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded bg-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImage} alt="" className="absolute inset-0 size-full object-cover" />
            </div>
          )}
          <input
            id="image"
            type="file"
            name="image"
            accept="image/*"
            className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-line file:px-4 file:py-2 file:text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {errors.image && <p className="mt-1.5 text-sm text-red-700">{errors.image}</p>}
          {initial && <p className="mt-1.5 text-xs text-muted">Laisser vide pour conserver l&apos;image actuelle.</p>}
        </div>

        {state.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.error}</p>}

        <div className="flex gap-3">
          <button className="btn btn-primary flex-1" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
          <Link href="/admin/oeuvres" className="btn btn-outline">Annuler</Link>
        </div>
      </aside>
    </form>
  );
}

function Text({
  name,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { name: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}{props.required && " *"}</label>
      <input id={name} name={name} className="field" aria-invalid={Boolean(error)} {...props} />
      {error && <p className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
