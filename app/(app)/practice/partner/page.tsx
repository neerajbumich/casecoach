import Link from "next/link";
import { CasePicker } from "@/components/CasePicker";
import { FeedbackImport } from "@/components/FeedbackImport";
import { requireUser } from "@/lib/auth";
import { allowedEmails } from "@/lib/auth-config";
import { getIndex } from "@/lib/cases";
import { getStore } from "@/lib/store";

export const metadata = { title: "Casing partner" };
const card = "rounded-xl border border-line bg-surface p-4";

export default async function PartnerPage() {
  const user = await requireUser();
  const { received, given } = await getStore().listFeedback(user.email).catch(() => ({ received: [], given: [] }));
  const others = allowedEmails().filter((e) => e !== user.email);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/practice" className="hover:underline">Practice</Link> / Casing partner</nav>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Casing partner</h1>
        <p className="text-sm text-ink-2">Interview a friend with any case in the library: you get the interviewer&apos;s view, exhibits to show full-screen, the answer key and a scoring form. Scorecards go to the candidate&apos;s journal.</p>
      </header>

      {received.length > 0 && (
        <section className={card} aria-labelledby="h-recv">
          <h2 id="h-recv" className="font-semibold">Scorecards you received</h2>
          <ul className="mt-2 divide-y divide-line">
            {received.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <b>{f.case_title}</b> · {f.scorecard.overall}/5
                  <span className="block text-xs text-muted">from {f.author_email} · {new Date(f.created_at).toLocaleDateString()}</span>
                </span>
                <FeedbackImport id={f.id} imported={f.imported} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2" aria-labelledby="h-pick">
        <h2 id="h-pick" className="font-semibold">Pick a case to give</h2>
        {others.length === 0 && (
          <p className={`${card} text-sm`}>
            No partners invited yet. {user.role === "owner" ? <>See <Link href="/settings#partners" className="underline">Settings → Casing partners</Link> to invite someone.</> : "Ask the app owner to invite your casing partner."}
          </p>
        )}
        <CasePicker cases={getIndex()} hrefBase="/practice/" hrefSuffix="/interviewer" />
      </section>

      {given.length > 0 && (
        <section className={card} aria-labelledby="h-given">
          <h2 id="h-given" className="font-semibold">Scorecards you gave</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {given.slice(0, 20).map((f) => (
              <li key={f.id}>{f.case_title} → {f.candidate_email} · {f.scorecard.overall}/5 · {new Date(f.created_at).toLocaleDateString()}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
