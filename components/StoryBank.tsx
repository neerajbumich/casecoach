"use client";
import { useMemo, useState } from "react";
import type { DrillResult, Story } from "@/lib/training-types";
import { newKey, useItems } from "@/components/useItems";

type Comp = { id: string; label: string; blurb: string };
type Q = { id: string; q: string; competencies: string[]; type: "story" | "motivation" | "resume"; follow_ups: string[]; tip: string };
type FirmFw = { firm: string; name: string; dimensions?: string[]; note: string; source?: string };
export type FitData = { competencies: Comp[]; questions: Q[]; star_guide: string[]; firm_frameworks: FirmFw[] };

// Rough mapping from McKinsey's PEI qualities to our competencies (for the coverage view).
const PEI: Record<string, string[]> = {
  "Personal impact": ["influence", "conflict"],
  "Entrepreneurial drive": ["initiative", "drive", "resilience"],
  "Inclusive leadership": ["leadership", "teamwork"],
  "Courageous change": ["initiative", "influence", "integrity"],
};

const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";
const input = "w-full rounded-lg border border-line bg-bg p-3 text-base";
const EMPTY: Story = { title: "", situation: "", task: "", action: "", result: "", reflection: "", competencies: [], updated: "" };
const TABS = ["Stories", "Coverage", "Practice", "Questions"] as const;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function Editor({ comps, initial, onSave, onCancel, onDelete }: { comps: Comp[]; initial: Story; onSave: (s: Story) => void; onCancel: () => void; onDelete?: () => void }) {
  const [s, setS] = useState<Story>(initial);
  const f = (k: keyof Story, label: string, hint: string, rows = 3) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <span className="block text-xs text-muted">{hint}</span>
      <textarea rows={rows} value={s[k] as string} onChange={(e) => setS({ ...s, [k]: e.target.value })} className={input} />
    </label>
  );
  return (
    <form className={`${card} space-y-3`} onSubmit={(e) => { e.preventDefault(); if (s.title.trim()) onSave({ ...s, updated: new Date().toISOString() }); }}>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Title</span>
        <input value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} className={input} placeholder="e.g. Turning around the late-delivery problem" required />
      </label>
      {f("situation", "Situation", "Context in 1-2 sentences: where, when, what was at stake.", 2)}
      {f("task", "Task", "Your specific responsibility or goal.", 2)}
      {f("action", "Actions", "What YOU did, step by step, and why. This is ~60% of the story.", 5)}
      {f("result", "Result", "Quantify it (%, $, time, people) and what would have happened without you.", 2)}
      {f("reflection", "Reflection", "What you learned and how you've used it since.", 2)}
      <fieldset>
        <legend className="text-sm font-medium">Competencies this story shows</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {comps.map((c) => {
            const on = s.competencies.includes(c.id);
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => setS({ ...s, competencies: on ? s.competencies.filter((x) => x !== c.id) : [...s.competencies, c.id] })}
                className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{c.label}</button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={`${btn} bg-accent text-accent-ink`}>Save story</button>
        <button type="button" onClick={onCancel} className={`${btn} border border-line`}>Cancel</button>
        {onDelete && <button type="button" onClick={onDelete} className={`${btn} ml-auto text-warn`}>Delete</button>}
      </div>
    </form>
  );
}

export function StoryBank({ data }: { data: FitData }) {
  const { items, put, remove, error } = useItems<Story>("story");
  const drills = useItems<DrillResult>("drill");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Stories");
  const [editing, setEditing] = useState<{ key: string; story: Story } | null>(null);
  const [q, setQ] = useState<Q | null>(null);
  const [qFilter, setQFilter] = useState("");
  const [picked, setPicked] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);
  const [started, setStarted] = useState<number | null>(null);

  const stories = useMemo(() => [...(items ?? [])].sort((a, b) => b.data.updated.localeCompare(a.data.updated)), [items]);
  const compLabel = (id: string) => data.competencies.find((c) => c.id === id)?.label ?? id;
  const count = (id: string) => stories.filter((s) => s.data.competencies.includes(id)).length;
  const pei = data.firm_frameworks.find((f) => f.firm === "McKinsey");

  function newQuestion(filter = qFilter) {
    const pool = data.questions.filter((x) => !filter || x.competencies.includes(filter) || x.type === filter);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setQ(next);
    setPicked(stories.find((s) => s.data.competencies.some((c) => next.competencies.includes(c)))?.key ?? "");
    setStarted(Date.now());
    setStatus(null);
  }

  const picks = q ? stories.filter((s) => s.data.competencies.some((c) => q.competencies.includes(c))) : [];
  const story = stories.find((s) => s.key === picked)?.data;

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Story bank" className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3 text-sm ${tab === t ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
            {t}{t === "Stories" && items ? ` (${stories.length})` : ""}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="text-sm text-warn">{error}</p>}

      {tab === "Stories" &&
        (editing ? (
          <Editor comps={data.competencies} initial={editing.story}
            onSave={(s) => { put(editing.key, s); setEditing(null); }}
            onCancel={() => setEditing(null)}
            onDelete={stories.some((x) => x.key === editing.key) ? () => { remove(editing.key); setEditing(null); } : undefined} />
        ) : (
          <div className="space-y-3">
            <button type="button" onClick={() => setEditing({ key: newKey(), story: EMPTY })} className={`${btn} bg-accent text-accent-ink`}>Add a story</button>
            {items === null ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : stories.length === 0 ? (
              <div className={`${card} space-y-2 text-sm`}>
                <p className="font-semibold">Build 8-10 stories you can flex across questions.</p>
                <ul className="list-disc space-y-1 pl-5 text-ink-2">{data.star_guide.map((g) => <li key={g}>{g}</li>)}</ul>
              </div>
            ) : (
              <ul className="space-y-2">
                {stories.map((s) => (
                  <li key={s.key}>
                    <button type="button" onClick={() => setEditing({ key: s.key, story: s.data })} className={`${card} block w-full text-left hover:bg-surface-2`}>
                      <span className="block font-semibold">{s.data.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-ink-2">{s.data.result || s.data.situation}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {s.data.competencies.map((c) => <span key={c} className="rounded-full bg-chip px-2 py-0.5 text-[11px]">{compLabel(c)}</span>)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

      {tab === "Coverage" && (
        <div className="space-y-4">
          <section className={card} aria-labelledby="h-cov">
            <h2 id="h-cov" className="font-semibold">Stories per competency</h2>
            <p className="text-xs text-muted">Aim for at least 2 per competency so you never reuse a story in the same interview day.</p>
            <ul className="mt-3 space-y-2">
              {data.competencies.map((c) => {
                const n = count(c.id);
                return (
                  <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-medium">{c.label}</span>
                      <span className="block truncate text-xs text-muted">{c.blurb}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${n >= 2 ? "bg-ok text-white" : n === 1 ? "bg-chip" : "border border-warn text-warn"}`}>
                      {n === 0 ? "gap" : `${n} ${n === 1 ? "story" : "stories"}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          {pei && (
            <section className={card} aria-labelledby="h-pei">
              <h2 id="h-pei" className="font-semibold">McKinsey PEI readiness</h2>
              <p className="text-xs text-muted">{pei.note}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {Object.entries(PEI).map(([dim, comps]) => {
                  const n = stories.filter((s) => s.data.competencies.some((c) => comps.includes(c))).length;
                  return (
                    <li key={dim} className="flex justify-between gap-2">
                      <span>{dim}</span>
                      <span className={n >= 2 ? "text-ok" : "text-warn"}>{n >= 2 ? `✓ ${n} stories` : `${n}/2 stories`}</span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted">Mapped from your story tags; approximate.</p>
            </section>
          )}
        </div>
      )}

      {tab === "Practice" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              <span className="sr-only">Question type</span>
              <select value={qFilter} onChange={(e) => setQFilter(e.target.value)} className="min-h-10 rounded-lg border border-line bg-surface px-3 text-sm">
                <option value="">Any question</option>
                <option value="motivation">Why consulting / why firm</option>
                <option value="resume">Resume walk-through</option>
                {data.competencies.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => newQuestion()} className={`${btn} bg-accent text-accent-ink`}>{q ? "Next question" : "Give me a question"}</button>
          </div>
          {q && (
            <>
              <section className={card}>
                <p className="text-lg font-semibold leading-snug">&ldquo;{q.q}&rdquo;</p>
                <p className="mt-1 text-sm text-ink-2">Tip: {q.tip}</p>
                {q.type === "story" && (
                  <label className="mt-3 block text-sm">
                    <span className="font-medium">Story to use</span>
                    <select value={picked} onChange={(e) => setPicked(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-surface px-3">
                      <option value="">{picks.length ? "Pick a story" : stories.length ? "No tagged match: pick any" : "No stories yet (answer anyway)"}</option>
                      {(picks.length ? picks : stories).map((s) => <option key={s.key} value={s.key}>{s.data.title}</option>)}
                    </select>
                  </label>
                )}
                {story && (
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer text-ink-2">Peek at your notes</summary>
                    <p className="mt-1"><b>S/T:</b> {story.situation} {story.task}</p>
                    <p><b>A:</b> {story.action}</p>
                    <p><b>R:</b> {story.result}</p>
                  </details>
                )}
              </section>
              <section className={card}>
                <p className="text-sm">Answer out loud in about 2 minutes, then the interviewer digs in:</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">{q.follow_ups.map((f) => <li key={f}>{f}</li>)}</ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={`${btn} border border-line`} onClick={async () => {
                    const txt = [
                      "Act as a McKinsey/BCG/Bain interviewer running a behavioral (PEI-style) interview. Ask me the question below, let me answer, then probe with 3-4 deep follow-ups one at a time. At the end, grade me 1-5 on: clarity of situation, focus on MY actions, quantified result, reflection, and conciseness, with the 2 biggest fixes.",
                      `Question: ${q.q}`,
                      story ? `My story notes (for your context; don't read them back):\nSituation: ${story.situation}\nTask: ${story.task}\nActions: ${story.action}\nResult: ${story.result}\nReflection: ${story.reflection}` : "",
                    ].filter(Boolean).join("\n\n");
                    setStatus((await copy(txt)) ? "✓ Copied. Paste into the Claude app (voice mode works well)." : "Couldn't copy.");
                  }}>Practice with Claude (copy prompt)</button>
                  <button type="button" className={`${btn} bg-accent text-accent-ink`} onClick={() => {
                    drills.put(newKey(), { drill: "fit", at: new Date().toISOString(), score: 1, avg_sec: started ? Math.round((Date.now() - started) / 1000) : undefined, ref: q.id, label: q.q });
                    newQuestion();
                  }}>Done: next question</button>
                </div>
                <p role="status" className="mt-2 min-h-5 text-sm text-ink-2">{status}</p>
              </section>
            </>
          )}
        </div>
      )}

      {tab === "Questions" && (
        <div className="space-y-4">
          {(["resume", "motivation", "story"] as const).map((t) => (
            <section key={t} className={card} aria-labelledby={`h-q-${t}`}>
              <h2 id={`h-q-${t}`} className="font-semibold">{t === "resume" ? "Resume & introduction" : t === "motivation" ? "Motivation" : "Behavioral (story) questions"}</h2>
              <ul className="mt-2 space-y-2 text-sm">
                {data.questions.filter((x) => x.type === t).map((x) => (
                  <li key={x.id}>
                    {x.q}
                    <span className="block text-xs text-muted">{x.competencies.map(compLabel).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section className={card} aria-labelledby="h-firmfw">
            <h2 id="h-firmfw" className="font-semibold">What each firm assesses</h2>
            <ul className="mt-2 space-y-3 text-sm">
              {data.firm_frameworks.map((f) => (
                <li key={f.firm}>
                  <b>{f.firm}: {f.name}</b>
                  {f.dimensions && <span className="block">{f.dimensions.join(" · ")}</span>}
                  <span className="block text-ink-2">{f.note}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
