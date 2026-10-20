"use client";

import { useActionState } from "react";
import { sendInquiry, type ContactState } from "@/app/[lang]/contact/actions";
import type { Locale } from "@/lib/i18n";
import { useDictionary } from "./DictionaryProvider";

type Props = { artworkId?: number; defaultMessage: string; lang: Locale };

export function ContactForm({ artworkId, defaultMessage, lang }: Props) {
  const t = useDictionary().form;
  const [state, action, pending] = useActionState<ContactState, FormData>(sendInquiry, { ok: false });

  if (state.ok) {
    return (
      <div className="rounded-sm border border-line bg-white p-8 text-center" role="status">
        <p className="font-serif text-3xl">{t.thanks}</p>
        <p className="mt-3 text-muted">{t.sent}</p>
      </div>
    );
  }

  const v = state.values ?? {};
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="lang" value={lang} />
      {artworkId && <input type="hidden" name="artworkId" value={artworkId} />}
      <div className="hidden" aria-hidden>
        <label>
          {t.website} <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.name} name="name" autoComplete="name" required defaultValue={v.name} error={err.name} />
        <Field label={t.phone} name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} error={err.phone} hint={t.optional} />
      </div>
      <Field label={t.email} name="email" type="email" autoComplete="email" required defaultValue={v.email} error={err.email} />

      <div>
        <label htmlFor="message" className="label">{t.message}</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="field resize-y"
          defaultValue={v.message ?? defaultMessage}
          aria-invalid={Boolean(err.message)}
          aria-describedby={err.message ? "message-error" : undefined}
        />
        {err.message && <p id="message-error" className="mt-1.5 text-sm text-red-700">{err.message}</p>}
      </div>

      {state.message && <p className="text-sm text-red-700" role="alert">{state.message}</p>}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label} {hint && <span className="normal-case tracking-normal text-muted/70">· {hint}</span>}
      </label>
      <input
        id={name}
        name={name}
        className="field"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">{error}</p>}
    </div>
  );
}
