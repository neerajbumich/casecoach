import { LoginForm } from "./LoginForm";
import { authMode } from "@/lib/auth-config";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reason?: string }> }) {
  const { error, reason } = await searchParams;
  const misconfigured = authMode() === "misconfigured" || error === "config";
  return (
    <main className="safe-top mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-bold text-accent-ink">C</span>
        <h1 className="text-xl font-semibold">CaseCoach</h1>
      </div>
      {misconfigured ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm">
          Sign-in isn&apos;t configured. Add the Supabase environment variables (see <code>.env.example</code>). The app stays locked until then.
        </p>
      ) : (
        <>
          {error === "link" && (
            <div role="alert" className="mb-4 space-y-1 rounded-lg bg-surface-2 p-3 text-sm">
              <p>
                {reason === "different-browser"
                  ? "That link was opened in a different browser from the one that requested it. Request a new link, then open it in this same browser (copy the link from the email and paste it here if your mail app opens another browser)."
                  : "That sign-in link didn't work. It may have expired or already been used. Request a new one below."}
              </p>
              {reason && reason !== "different-browser" && <p className="text-xs text-muted">Reason: {reason}</p>}
            </div>
          )}
          <LoginForm />
        </>
      )}
      <p className="mt-6 text-xs text-muted">Private study app. Invite only.</p>
    </main>
  );
}
