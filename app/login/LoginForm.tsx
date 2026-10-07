"use client";
import { useActionState } from "react";
import { sendLink, signInWithPassword, type LoginState } from "./actions";

const field = "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base";

export function LoginForm() {
  const [pw, signIn, signingIn] = useActionState<LoginState, FormData>(signInWithPassword, {});
  const [link, send, sending] = useActionState<LoginState, FormData>(sendLink, {});

  return (
    <div className="space-y-6">
      <form action={signIn} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required defaultValue={pw.email} className={field} />
        <label htmlFor="password" className="block text-sm font-medium">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={field} />
        {pw.error && <p role="alert" className="text-sm text-warn">{pw.error}</p>}
        <button className="h-12 w-full rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-60" disabled={signingIn}>{signingIn ? "Signing in…" : "Sign in"}</button>
      </form>

      <form action={send} className="space-y-2 border-t border-line pt-5">
        <p className="text-sm font-medium">First time, or no password yet?</p>
        <p className="text-xs text-muted">We&apos;ll email you a one-time sign-in link. Open it on this same device, then set a password in Settings for your iPhone.</p>
        <label htmlFor="email2" className="sr-only">Email for sign-in link</label>
        <input id="email2" name="email" type="email" autoComplete="email" required placeholder="you@umich.edu" defaultValue={link.email} className={field} />
        {link.error && <p role="alert" className="text-sm text-warn">{link.error}</p>}
        {link.message && <p role="status" className="text-sm text-ok">{link.message}</p>}
        <button className="h-11 w-full rounded-xl border border-line text-sm font-semibold disabled:opacity-60" disabled={sending}>{sending ? "Sending…" : "Email me a sign-in link"}</button>
      </form>
    </div>
  );
}
