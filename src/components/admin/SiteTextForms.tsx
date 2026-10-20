"use client";

import { startTransition, useActionState, useState } from "react";
import { saveSiteTexts, type FormState } from "@/app/admin/actions";
import { textVariables } from "@/app/admin/(protected)/textes/sections";

type Langs = { fr: string; en: string };
type Text = { key: string; label: string; defaults: Langs; values: Langs };

const LANG_NAMES: Record<keyof Langs, string> = { fr: "Français", en: "Anglais" };

/** Textes d'une page du site, enregistrés ensemble. */
export function SiteTextSection({ id, title, texts }: { id: string; title: string; texts: Text[] }) {
  const [state, save, saving] = useActionState(saveSiteTexts, {} as FormState);
  const [dirty, setDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <details id={id} open={id === "accueil"} className="scroll-mt-24 rounded-lg border border-line bg-white">
      <summary className="cursor-pointer px-5 py-4 font-serif text-2xl">{title}</summary>
      <form
        className="space-y-6 border-t border-line p-5"
        onChange={() => setDirty(true)}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setSubmitted(true);
          setDirty(false);
          startTransition(() => save(data));
        }}
      >
        {texts.map((text) => (
          <TextField key={text.key} text={text} onReset={() => setDirty(true)} />
        ))}
        <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-4 border-t border-line bg-white/95 px-5 py-3">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {state.error ? (
            <p className="text-sm text-red-700">{state.error}</p>
          ) : (
            submitted && !saving && !dirty && <p className="text-sm text-available">Textes enregistrés, le site est à jour.</p>
          )}
        </div>
      </form>
    </details>
  );
}

function TextField({ text, onReset }: { text: Text; onReset: () => void }) {
  const [values, setValues] = useState(text.values);
  const variables = textVariables(text.defaults.fr);
  const long = (["fr", "en"] as const).some((l) => text.defaults[l].includes("\n") || text.defaults[l].length > 70);
  const changed = values.fr.trim() !== text.defaults.fr.trim() || values.en.trim() !== text.defaults.en.trim();

  return (
    <fieldset>
      <input type="hidden" name="key" value={text.key} />
      <legend className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-medium">
        {text.label}
        {variables.length > 0 && (
          <span className="text-xs font-normal text-muted">Variables : {variables.join(", ")}</span>
        )}
        {changed && (
          <button
            type="button"
            className="ml-auto text-xs font-normal text-muted underline underline-offset-2 hover:text-ink"
            onClick={() => {
              setValues(text.defaults);
              onReset();
            }}
          >
            Revenir au texte d&apos;origine
          </button>
        )}
      </legend>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        {(["fr", "en"] as const).map((lang) => {
          const props = {
            name: `${text.key}:${lang}`,
            value: values[lang],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setValues((v) => ({ ...v, [lang]: e.target.value })),
            className: "field",
            "aria-label": `${text.label} (${LANG_NAMES[lang]})`,
            lang,
          };
          return (
            <label key={lang} className="block">
              <span className="mb-1 block text-xs tracking-wider text-muted uppercase">{lang}</span>
              {long ? (
                <textarea {...props} rows={Math.min(10, Math.ceil(text.defaults[lang].length / 60) + 1)} className="field resize-y" />
              ) : (
                <input {...props} />
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
