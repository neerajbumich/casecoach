import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { DIMENSIONS, averageScores } from "@/lib/scoring";
import { activityDays, dayKey, dueCards, streak } from "@/lib/training";
import type { DrillResult, SrsState, Story } from "@/lib/training-types";
import { TYPES } from "@/lib/mental-math";
import { buildDeck } from "@/lib/flashcards";
import { listSizing } from "@/lib/sizing";
import fit from "@/data/drills/fit-questions.json";

export const metadata = { title: "Progress" };
const card = "rounded-xl border border-line bg-surface p-4";
const pct = (x: number) => `${Math.round(x * 100)}%`;

function Heatmap({ days }: { days: Map<string, number> }) {
  // Last 12 weeks, Monday-first columns. Single hue; darker = more activity.
  const today = new Date(`${dayKey()}T12:00:00Z`);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - 7 * 11 - ((today.getUTCDay() + 6) % 7));
  const cells: { k: string; n: number; future: boolean }[] = [];
  for (let d = new Date(start); cells.length < 84; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    cells.push({ k, n: days.get(k) ?? 0, future: d > today });
  }
  const level = (n: number) => (n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);
  const bg = ["bg-surface-2", "bg-accent/30", "bg-accent/60", "bg-accent"];
  const active = cells.filter((c) => c.n > 0).length;
  return (
    <figure aria-label={`Practice activity, last 12 weeks: ${active} active days`}>
      <div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
        {cells.map((c) => (
          <div key={c.k} title={`${c.k}: ${c.n} activit${c.n === 1 ? "y" : "ies"}`} className={`aspect-square rounded-[3px] ${c.future ? "opacity-0" : bg[level(c.n)]}`} />
        ))}
      </div>
      <figcaption className="mt-2 text-xs text-muted">{active} active days in the last 12 weeks. Mock cases and drills both count.</figcaption>
    </figure>
  );
}

export default async function ProgressPage() {
  const user = await requireUser();
  const store = getStore();
  const [sessions, drillsRaw, srs, stories, fb] = await Promise.all([
    store.listSessions(),
    store.listItems<DrillResult>("drill").catch(() => []),
    store.listItems<SrsState>("srs").catch(() => []),
    store.listItems<Story>("story").catch(() => []),
    store.listFeedback(user.email).catch(() => ({ received: [], given: [] })),
  ]);
  const drills = drillsRaw.map((d) => d.data);
  const days = activityDays(sessions, drills);
  const s = streak(days);
  const avg = averageScores(sessions);
  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = drills.filter((d) => new Date(d.at).getTime() > weekAgo).length + sessions.filter((x) => new Date(x.started_at).getTime() > weekAgo).length;

  // Mental math: accuracy and speed by type over the last 10 runs.
  const math = drills.filter((d) => d.drill === "math").sort((a, b) => a.at.localeCompare(b.at));
  const byType: Record<string, { n: number; correct: number; sec: number }> = {};
  for (const r of math.slice(-10)) for (const [k, v] of Object.entries(r.by_type ?? {})) {
    byType[k] ??= { n: 0, correct: 0, sec: 0 };
    byType[k].n += v.n;
    byType[k].correct += v.correct;
    byType[k].sec += v.sec;
  }
  const sizing = drills.filter((d) => d.drill === "sizing");
  const sizingIds = new Set(sizing.map((d) => d.ref));
  const deck = buildDeck();
  const mastered = srs.filter((x) => x.data.interval >= 21).length;
  const pendingFb = fb.received.filter((f) => !f.imported).length;
  const comps = (fit as { competencies: { id: string; label: string }[] }).competencies;
  const gaps = comps.filter((c) => !stories.some((st) => st.data.competencies.includes(c.id)));
  const commDrills = drills.filter((d) => ["structure", "exhibit", "synthesis"].includes(d.drill)).length;

  const tiles = [
    { k: "Streak", v: s ? `${s} day${s === 1 ? "" : "s"}` : "0" },
    { k: "This week", v: `${thisWeek} ${thisWeek === 1 ? "activity" : "activities"}` },
    { k: "Mock cases", v: String(sessions.length) },
    { k: "Avg score (last 10)", v: sessions.length ? `${(sessions.slice(0, 10).reduce((a, x) => a + (x.overall ?? 0), 0) / Math.min(10, sessions.length)).toFixed(1)}/5` : "—" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
          <p className="text-sm text-muted">Everything you&apos;ve practiced, in one place.</p>
        </div>
        <Link href="/journal" className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-sm font-semibold">Mistake journal →</Link>
      </header>

      {pendingFb > 0 && (
        <Link href="/practice/partner" className="block rounded-xl border border-accent bg-surface p-4 text-sm">
          <b>{pendingFb} scorecard{pendingFb === 1 ? "" : "s"} from a casing partner</b> waiting. Review and add {pendingFb === 1 ? "it" : "them"} to your journal →
        </Link>
      )}

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.k} className={card}>
            <dt className="text-xs text-muted">{t.k}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{t.v}</dd>
          </div>
        ))}
      </dl>

      <section className={card} aria-labelledby="h-act">
        <h2 id="h-act" className="mb-3 font-semibold">Activity</h2>
        <Heatmap days={days} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={card} aria-labelledby="h-skills">
          <h2 id="h-skills" className="font-semibold">Interview skills</h2>
          <p className="text-xs text-muted">Average of your last 10 scored cases.</p>
          <ul className="mt-2 space-y-1.5">
            {DIMENSIONS.map((d) => {
              const v = avg[d.key];
              return (
                <li key={d.key} className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] items-center gap-2 text-sm">
                  <span className="truncate">{d.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-series" style={{ width: `${((v ?? 0) / 5) * 100}%` }} /></span>
                  <span className="text-right tabular-nums text-muted">{v ?? "—"}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={card} aria-labelledby="h-math">
          <div className="flex items-baseline justify-between"><h2 id="h-math" className="font-semibold">Mental math</h2><Link href="/practice/math" className="text-sm underline">Drill</Link></div>
          {math.length === 0 ? (
            <p className="mt-1 text-sm text-muted">No runs yet.</p>
          ) : (
            <>
              <p className="text-xs text-muted">{math.length} runs · last: {math[math.length - 1].correct}/{math[math.length - 1].n} in {math[math.length - 1].avg_sec}s avg</p>
              <ul className="mt-2 space-y-1.5">
                {TYPES.filter((t) => byType[t.key]).map((t) => {
                  const v = byType[t.key];
                  return (
                    <li key={t.key} className="grid grid-cols-[minmax(0,1fr)_7rem_5.5rem] items-center gap-2 text-sm">
                      <span className="truncate">{t.label}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-series" style={{ width: pct(v.correct / v.n) }} /></span>
                      <span className="text-right tabular-nums text-muted">{pct(v.correct / v.n)} · {(v.sec / v.n).toFixed(0)}s</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section className={card} aria-labelledby="h-drills">
          <h2 id="h-drills" className="font-semibold">Drills</h2>
          <dl className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between gap-2"><dt><Link href="/practice/sizing" className="underline">Market sizing</Link></dt><dd className="tabular-nums">{sizingIds.size}/{listSizing().length} tried · {sizing.length ? pct(sizing.filter((d) => d.score >= 1).length / sizing.length) : "—"} in range</dd></div>
            <div className="flex justify-between gap-2"><dt><Link href="/practice/cards" className="underline">Flashcards</Link></dt><dd className="tabular-nums">{srs.length}/{deck.length} seen · {mastered} mastered · {dueCards(srs)} due</dd></div>
            <div className="flex justify-between gap-2"><dt><Link href="/communication" className="underline">Communication drills</Link></dt><dd className="tabular-nums">{commDrills} done</dd></div>
            <div className="flex justify-between gap-2"><dt><Link href="/practice/fit" className="underline">Fit stories</Link></dt><dd className="tabular-nums">{stories.length} stories · {gaps.length ? `${gaps.length} gaps` : "all covered"}</dd></div>
          </dl>
          {gaps.length > 0 && stories.length > 0 && <p className="mt-2 text-xs text-muted">No story yet for: {gaps.map((g) => g.label).join(", ")}.</p>}
        </section>

        <section className={card} aria-labelledby="h-recent">
          <h2 id="h-recent" className="font-semibold">Recent mock cases</h2>
          {sessions.length === 0 ? (
            <p className="mt-1 text-sm text-muted">None yet. <Link href="/practice" className="underline">Start one</Link>.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {sessions.slice(0, 6).map((x) => (
                <li key={x.id} className="flex justify-between gap-2">
                  <Link href={`/sessions/${x.id}`} className="truncate underline">{x.case_title}</Link>
                  <span className="shrink-0 tabular-nums text-muted">{x.overall ?? "—"}/5{x.source === "partner" ? " · partner" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
