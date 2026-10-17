"use client";

import { useActionState } from "react";
import { sendInquiry, type ContactState } from "@/app/(site)/contact/actions";

type Props = { artworkId?: number; defaultMessage: string };

export function ContactForm({ artworkId, defaultMessage }: Props) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendInquiry, { ok: false });

  if (state.ok) {
    return (
      <div className="rounded-sm border border-line bg-white p-8 text-center" role="status">
        <p className="font-serif text-3xl">Merci !</p>
        <p className="mt-3 text-muted">
          Votre message a bien été envoyé. La galerie vous répondra dans les meilleurs délais.
        </p>
      </div>
    );
  }

  const v = state.values ?? {};
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {artworkId && <input type="hidden" name="artworkId" value={artworkId} />}
      <div className="hidden" aria-hidden>
        <label>
          Site web <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom" name="name" autoComplete="name" required defaultValue={v.name} error={err.name} />
        <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} error={err.phone} hint="Facultatif" />
      </div>
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={v.email} error={err.email} />

      <div>
        <label htmlFor="message" className="label">Message</label>
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
        {pending ? "Envoi…" : "Envoyer le message"}
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
