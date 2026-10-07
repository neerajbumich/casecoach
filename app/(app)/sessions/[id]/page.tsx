import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { DIMENSIONS, FIRM_MODES, MISTAKE_CATEGORIES } from "@/lib/scoring";
import { DeleteSession } from "@/components/DeleteSession";

export const metadata = { title: "Scorecard" };

const card = "rounded-xl border border-line bg-surface p-4";

function Bar({ v }: { v: number }) {
  return (
    <span className="relative block h-2 w-full rounded-full bg-line" aria-hidden>
      <span className="absolute inset-y-0 left-0 rounded-full bg-series" style={{ width: `${(v / 5) * 100}%` }} />
    </span>
  );
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getStore().getSession(id);
  if (!s) notFound();
  const c = s.scorecard;
  const catLabel = (k: string) => MISTAKE_CATEGORIES.find((m) => m.key === k)?.label ?? k;
  return (
    <article className="mx-auto max-w-3xl space-y-3">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/sessions" className="hover:underline">Session log</Link> / {s.case_title}
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{s.case_title}</h1>
          <p className="text-sm text-muted">
            {new Date(s.started_at).toLocaleString()} · {FIRM_MODES.find((f) => f.key === s.firm_mode)?.label} · {s.duration_min ?? "?"} min · {s.hints_used} hint{s.hints_used === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-semibold tabular-nums">{s.overall}<span className="text-base text-muted">/5</span></p>
          <p className="text-xs text-muted">overall</p>
        </div>
      </header>

      <section className={card} aria-labelledby="h-scores">
        <h2 id="h-scores" className="mb-2 font-semibold">Scores</h2>
        <ul className="space-y-2">
          {DIMENSIONS.map((d) => {
            const x = c.scores[d.key];
            return (
              <li key={d.key}>
                <details>
                  <summary className="grid grid-cols-[1fr_5rem_2rem] items-center gap-3 py-1 text-sm">
                    <span>{d.label}</span>
                    <Bar v={x.score} />
                    <span className="text-right font-semibold tabular-nums">{x.score}</span>
                  </summary>
                  <div className="mb-2 rounded-lg bg-surface-2 p-3 text-sm">
                    {x.comment && <p>{x.comment}</p>}
                    {x.evidence.map((q, i) => (
                      <blockquote key={i} className="mt-1 border-l-2 border-line pl-2 italic text-ink-2">&ldquo;{q}&rdquo;</blockquote>
                    ))}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      {c.where_i_went_wrong.length > 0 && (
        <section className={card} aria-labelledby="h-wrong">
          <h2 id="h-wrong" className="mb-2 font-semibold">Where it went wrong</h2>
          <ol className="space-y-3 text-sm">
            {c.where_i_went_wrong.map((w, i) => (
              <li key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{w.moment}</p>
                <p>{w.what_happened}</p>
                <p className="mt-1 text-ok">Better: {w.better}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className={card} aria-labelledby="h-fw">
        <h2 id="h-fw" className="mb-2 font-semibold">Your framework vs the ideal</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase text-muted">Yours</dt><dd>{c.framework_comparison.mine || "–"}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-muted">Ideal</dt><dd>{c.framework_comparison.ideal || "–"}</dd></div>
        </dl>
        {c.framework_comparison.gap && <p className="mt-3 rounded-lg bg-surface-2 p-3 text-sm"><b>Gap:</b> {c.framework_comparison.gap}</p>}
        {c.alternative_frameworks.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold">Other frameworks that would have worked</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {c.alternative_frameworks.map((a, i) => <li key={i}><b>{a.name}:</b> {a.why}</li>)}
            </ul>
          </>
        )}
      </section>

      {c.drills.length > 0 && (
        <section className={card} aria-labelledby="h-drills">
          <h2 id="h-drills" className="mb-2 font-semibold">Drills to fix this</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {c.drills.map((d, i) => <li key={i}><b>{d.title}.</b> {d.how}</li>)}
          </ol>
        </section>
      )}

      {c.mistakes.length > 0 && (
        <section className={card} aria-labelledby="h-mis">
          <h2 id="h-mis" className="mb-2 font-semibold">Mistakes logged to your journal ({c.mistakes.length})</h2>
          <ul className="space-y-2 text-sm">
            {c.mistakes.map((m, i) => (
              <li key={i}>
                <span className="mr-2 rounded bg-chip px-1.5 py-0.5 text-xs">{catLabel(m.category)}</span>
                {m.description}
                {m.quote && <span className="block italic text-muted">&ldquo;{m.quote}&rdquo;</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {s.transcript && (
        <details className={card}>
          <summary className="font-semibold">Transcript</summary>
          <pre className="mt-2 max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs">{s.transcript}</pre>
        </details>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <Link href={`/case/${s.case_id}`} className="rounded-lg border border-line px-4 py-2 text-sm">Review the case</Link>
        <Link href="/journal" className="rounded-lg border border-line px-4 py-2 text-sm">Mistake journal</Link>
        <DeleteSession id={s.id} />
      </div>
    </article>
  );
}
