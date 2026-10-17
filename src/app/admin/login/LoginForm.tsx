"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="username" className="label">Identifiant</label>
        <input id="username" name="username" className="field" autoComplete="username" required autoFocus defaultValue={state.username} />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-red-700" role="alert">{state.error}</p>}
      <button className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
