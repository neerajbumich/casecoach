"use client";
import { useEffect, useState } from "react";
import { useActionState } from "react";
import { setPassword, signOut, type LoginState } from "@/app/login/actions";

function PasswordForm() {
  const [st, save, saving] = useActionState<LoginState, FormData>(setPassword, {});
  return (
    <form action={save} className="mt-3 flex flex-wrap gap-2">
      <label htmlFor="newpw" className="sr-only">New password</label>
      <input id="newpw" name="password" type="password" autoComplete="new-password" minLength={10} required placeholder="New password (10+ characters)" className="min-h-10 flex-1 rounded-lg border border-line bg-bg px-3 text-base" />
      <button disabled={saving} className="min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60">{saving ? "Saving…" : "Save password"}</button>
      {st.error && <p role="alert" className="w-full text-sm text-warn">{st.error}</p>}
      {st.message && <p role="status" className="w-full text-sm text-ok">{st.message}</p>}
    </form>
  );
}

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  try {
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
  } catch {}
}

export function Settings({ email, pages, images, caseCount, ai, role = "owner", partners = [] }: { email: string; pages: string[]; images: string[]; caseCount: number; ai: { on: boolean; spent: number; cap: number }; role?: "owner" | "partner"; partners?: string[] }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [dl, setDl] = useState<{ done: number; total: number; failed: number } | null>(null);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      if (t === "light" || t === "dark") setTheme(t);
    } catch {}
    if ("serviceWorker" in navigator) navigator.serviceWorker.getRegistration().then((r) => setSwReady(!!r?.active));
  }, []);

  // Fetching each page/image lets the service worker store it for offline reading.
  async function saveOffline() {
    const all = [...pages, ...images];
    let done = 0,
      failed = 0;
    setDl({ done, total: all.length, failed });
    const queue = [...all];
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift()!;
        try {
          const r = await fetch(url, { headers: url.startsWith("/api/") ? {} : { Accept: "text/html" }, credentials: "same-origin" });
          if (!r.ok) failed++;
        } catch {
          failed++;
        }
        done++;
        setDl({ done, total: all.length, failed });
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  }

  async function handleSignOut() {
    // Remove offline copies of case content from this device before signing out.
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {}
    await signOut();
  }

  const card = "rounded-xl border border-line bg-surface p-4";
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className={card} aria-labelledby="h-theme">
        <h2 id="h-theme" className="font-semibold">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="mt-3 flex gap-2">
          {(["system", "light", "dark"] as Theme[]).map((t) => (
            <button
              key={t}
              role="radio"
              aria-checked={theme === t}
              onClick={() => {
                setTheme(t);
                applyTheme(t);
              }}
              className={`min-h-10 flex-1 rounded-lg border px-3 text-sm capitalize ${theme === t ? "border-accent bg-accent text-accent-ink" : "border-line"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className={card} aria-labelledby="h-off">
        <h2 id="h-off" className="font-semibold">Offline library</h2>
        <p className="mt-1 text-sm text-ink-2">
          Pages you open are saved automatically. Save everything now ({caseCount} cases, {images.length} exhibit images) to read on a plane or the subway.
        </p>
        {!swReady && <p className="mt-2 text-xs text-muted">Offline mode starts after the app&apos;s first full load in a production build.</p>}
        <button onClick={saveOffline} disabled={!!dl && dl.done < dl.total} className="mt-3 min-h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60">
          {dl && dl.done < dl.total ? `Saving… ${dl.done}/${dl.total}` : "Save library for offline"}
        </button>
        {dl && dl.done === dl.total && (
          <p className="mt-2 text-sm" role="status">
            {dl.failed ? `Saved with ${dl.failed} failures. Try again on a better connection.` : "All set. The library works offline on this device."}
          </p>
        )}
      </section>

      <section className={card} aria-labelledby="h-ai">
        <h2 id="h-ai" className="font-semibold">In-app AI interviewer</h2>
        {ai.on ? (
          <p className="mt-1 text-sm text-ink-2">On. API spend this month: ${ai.spent.toFixed(2)} of your ${ai.cap} cap. It stops automatically at the cap.</p>
        ) : (
          <p className="mt-1 text-sm text-ink-2">Off. Practice runs in the Claude app at no extra cost. To turn this on, set <code>ANTHROPIC_API_KEY</code> and <code>MONTHLY_SPEND_CAP_USD</code> in Vercel.</p>
        )}
      </section>

      {role === "owner" && (
        <section id="partners" className={card} aria-labelledby="h-partners">
          <h2 id="h-partners" className="font-semibold">Casing partners</h2>
          {partners.length ? (
            <ul className="mt-2 space-y-1 text-sm">{partners.map((p) => <li key={p}>{p}</li>)}</ul>
          ) : (
            <p className="mt-1 text-sm text-ink-2">No partners invited yet.</p>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">How to invite someone</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-2">
              <li>Add their email to <code>PARTNER_EMAILS</code> (comma-separated): in Vercel under Project → Settings → Environment Variables, and in <code>.env.local</code> when running on your Mac. Then redeploy or restart.</li>
              <li>They open the app and sign in with that email (sign-in link, then set a password).</li>
              <li>They can use the library, drills and interviewer mode. Their sessions and stories are private to them, and they can&apos;t see yours.</li>
              <li>To trade scorecards, open Practice → Casing partner and pick a case to give.</li>
            </ol>
            <p className="mt-2 text-xs text-muted">Only invite people studying with you: the case books are for personal study.</p>
          </details>
        </section>
      )}

      <section className={card} aria-labelledby="h-acct">
        <h2 id="h-acct" className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-ink-2">Signed in as {email}</p>
        <p className="mt-3 text-sm font-medium">Password for the iPhone app</p>
        <p className="text-xs text-muted">Email sign-in links open in Safari, not the home-screen app. Set a password here, then sign in with it on your phone.</p>
        <PasswordForm />
        <button onClick={handleSignOut} className="mt-3 min-h-10 rounded-lg border border-line px-4 text-sm">Sign out and clear offline copies</button>
      </section>

      <section className={card} aria-labelledby="h-about">
        <h2 id="h-about" className="font-semibold">Install on iPhone</h2>
        <p className="mt-1 text-sm text-ink-2">In Safari, tap Share, then Add to Home Screen. CaseCoach opens full-screen and works offline.</p>
      </section>
    </div>
  );
}
