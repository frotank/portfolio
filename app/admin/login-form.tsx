"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    { error: null }
  );

  return (
    <div className="pw-carbon flex min-h-screen items-center justify-center px-6 font-body text-silver">
      <form
        action={action}
        className="w-full max-w-sm overflow-hidden rounded-md border border-line bg-panel"
      >
        <div className="pw-kerb" aria-hidden="true" />
        <div className="p-8">
          {/* start-light gantry: all five light while checking */}
          <div className="mb-6 flex gap-2" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-2.5 w-6 rounded-sm transition ${
                  pending
                    ? "bg-race-red shadow-[0_0_10px_rgba(225,6,0,.6)]"
                    : "bg-carbon"
                } border border-line`}
              />
            ))}
          </div>
          <p className="font-data text-[10px] uppercase tracking-[0.25em] text-dim">
            Car No. 09 · Restricted
          </p>
          <h1 className="pw-title-lg mt-2 font-display font-bold uppercase italic">
            Pit wall
          </h1>
          <p className="mt-2 text-sm text-dim">
            Enter the garage password to edit the live site.
          </p>
          <label className="mt-6 block font-data text-[11px] uppercase tracking-wider text-dim">
            Password
            <input
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-sm border border-line bg-carbon/70 px-3 py-2 font-body text-base text-silver outline-none transition focus:border-race-purple focus:bg-carbon"
            />
          </label>
          {state.error && (
            <p className="mt-3 rounded-sm border border-race-red/40 bg-race-red/10 px-3 py-2 text-sm text-red-hot">
              {state.error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-6 w-full rounded-sm bg-race-red px-4 py-2.5 font-display font-bold uppercase italic tracking-wider text-white transition hover:bg-red-hot disabled:opacity-60"
          >
            {pending ? "Lights out…" : "Open the garage"}
          </button>
        </div>
      </form>
    </div>
  );
}
