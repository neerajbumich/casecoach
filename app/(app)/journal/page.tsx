import Link from "next/link";
import { getStore } from "@/lib/store";
import { recommendNext } from "@/lib/recommend";
import { DIMENSIONS, averageScores, mistakeTrends } from "@/lib/scoring";
import { moduleForMistake } from "@/lib/communication";

export const metadata = { title: "Mistake journal" };
const card = "rounded-xl border border-line bg-surface p-4";

// Overall score per session, oldest → newest. Single series, so no legend; values labelled at the ends.
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="text-sm text-muted">Save at least 2 sessions to see a trend.</p>;
  const w = 320, h = 80, pad = 8;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (values.length - 1);
  const y = (v: number) => h - pad - ((v - 1) / 4) * (h - pad * 2);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label={`Overall score across ${values.length} sessions, from ${values[0]} to ${values[values.length - 1]}`}>
      {[1, 3, 5].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="var(--line)" strokeWidth="1" />
          <text x={w - pad} y={y(g) - 2} textAnchor="end" fontSize="9" fill="var(--muted)">{g}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="var(--series)" stroke="var(--surface)" strokeWidth="2">
          <title>{`Session ${i + 1}: ${v}/5`}</title>
        </circle>
      ))}
    </svg>
  );
}

export default async function JournalPage() {
  const store = getStore();
  const [sessions, mistakes, progress] = await Promise.all([store.listSessions(), store.listMistakes(), store.getProgress()]);
  const avg = averageScores(sessions);
  const trends = mistakeTrends(sessions, mistakes);
  const rec = recommendNext(sessions, new Set(Object.keys(progress)));
  const overall = [...sessions].sort((a, b) => a.started_at.localeCompare(b.started_at)).map((s) => s.overall).filter((v): v is number => v != null);
  const headline = trends.filter((t) => t.changePct != null).sort((a, b) => (a.changePct as number) - (b.changePct as number));
  const window = Math.min(10, sessions.length);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mistake journal</h1>
        <p className="text-sm text-muted">Built from {sessions.length} saved session{sessions.length === 1 ? "" : "s"} and {mistakes.length} logged mistake{mistakes.length === 1 ? "" : "s"}.</p>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Nothing yet. After each mock case, save the scorecard: mistakes are tagged and tracked here automatically.{" "}
          <Link href="/practice" className="underline">Start a case</Link>
        </p>
      ) : (
        <>
          {rec && (
            <Link href={`/practice/${rec.caseEntry.id}`} className="block rounded-xl border border-accent/40 bg-surface p-4 hover:bg-surface-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Next case · targets {rec.label} (your weakest, avg {rec.avg}/5)</p>
              <p className="mt-1 font-semibold">{rec.caseEntry.title}</p>
              <p className="text-sm text-ink-2">{rec.why}</p>
            </Link>
          )}

          {headline.length > 0 && (
            <section className={card} aria-labelledby="h-trend">
              <h2 id="h-trend" className="font-semibold">Trends over your last {window} cases</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {headline.map((t) => (
                  <li key={t.category}>
                    <b>{t.label}</b>{" "}
                    {t.changePct === 0 ? "unchanged" : (t.changePct as number) < 0 ? <span className="text-ok">down {Math.abs(t.changePct as number)}%</span> : <span className="text-warn">up {t.changePct}%</span>}
                    <span className="text-muted"> ({t.earlier.toFixed(1)} → {t.recent.toFixed(1)} per case)</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={card} aria-labelledby="h-overall">
            <h2 id="h-overall" className="font-semibold">Overall score by session</h2>
            <Sparkline values={overall} />
          </section>

          <section className={card} aria-labelledby="h-avg">
            <h2 id="h-avg" className="font-semibold">Average by dimension (last {window})</h2>
            <ul className="mt-2 space-y-1.5">
              {DIMENSIONS.map((d) => ({ d, v: avg[d.key] }))
                .sort((a, b) => (a.v ?? 9) - (b.v ?? 9))
                .map(({ d, v }) => (
                  <li key={d.key} className="grid grid-cols-[minmax(0,11rem)_1fr_2.5rem] items-center gap-3 text-sm">
                    <span className="truncate">{d.label}</span>
                    <span className="relative h-2.5 rounded-full bg-line" aria-hidden>
                      <span className="absolute inset-y-0 left-0 rounded-full bg-series" style={{ width: `${((v ?? 0) / 5) * 100}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{v ?? "–"}</span>
                  </li>
                ))}
            </ul>
          </section>

          <section className={card} aria-labelledby="h-cats">
            <h2 id="h-cats" className="font-semibold">Recurring mistakes</h2>
            {trends.length === 0 ? (
              <p className="mt-1 text-sm text-muted">No mistakes logged yet.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {trends.map((t) => (
                  <details key={t.category} className="rounded-lg bg-surface-2">
                    <summary className="flex min-h-10 items-center justify-between px-3 text-sm">
                      <span className="font-medium">{t.label}</span>
                      <span className="tabular-nums text-muted">{t.total}×</span>
                    </summary>
                    <ul className="space-y-2 px-3 pb-3 text-sm">
                      {mistakes
                        .filter((m) => m.category === t.category)
                        .slice(0, 12)
                        .map((m) => {
                          const s = sessions.find((x) => x.id === m.session_id);
                          return (
                            <li key={m.id}>
                              {m.description}
                              <span className="block text-xs text-muted">
                                {s ? <Link href={`/sessions/${s.id}`} className="underline">{s.case_title}</Link> : m.case_id} · {new Date(m.created_at).toLocaleDateString()}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                    {moduleForMistake(t.category) && (
                      <p className="px-3 pb-3 text-sm">
                        <Link href={`/communication/${moduleForMistake(t.category)!.id}`} className="font-medium underline">How to fix it: {moduleForMistake(t.category)!.title} →</Link>
                      </p>
                    )}
                  </details>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
