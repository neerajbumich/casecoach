"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CaseRecord, Exhibit } from "@/lib/schema/case";
import { DIMENSIONS, FIRM_MODES, MISTAKE_CATEGORIES, type FirmMode } from "@/lib/scoring";

const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";
const label = "text-xs font-semibold uppercase tracking-wide text-muted";

function Table({ data }: { data: NonNullable<Exhibit["data"]> }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr>{data.columns.map((c, i) => <th key={i} className="border-b border-line px-2 py-1 text-left font-semibold">{c}</th>)}</tr></thead>
        <tbody>{data.rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className="border-b border-line px-2 py-1 tabular-nums">{String(v ?? "")}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** Full-screen exhibit to turn toward the candidate. Never shows images flagged as containing answers. */
function Present({ e, onClose }: { e: Exhibit; onClose: () => void }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const img = e.image_path && !e.image_has_answers;
  return (
    <div role="dialog" aria-modal="true" aria-label={`Exhibit: ${e.title}`} className="fixed inset-0 z-50 flex flex-col bg-white p-4 text-black">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-lg font-semibold">{e.title}</p>
        <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-black/20 px-4 text-sm font-semibold" autoFocus>Close</button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={`/api/${e.image_path}`} alt={e.title} className="mx-auto h-auto max-h-full w-auto max-w-full" /> : e.data ? <Table data={e.data} /> : <p>{e.description}</p>}
      </div>
    </div>
  );
}

function Key({ children, title = "Answer key" }: { children: React.ReactNode; title?: string }) {
  return (
    <details className="mt-2 rounded-lg bg-surface-2 p-2 text-sm">
      <summary className="cursor-pointer font-medium">{title}</summary>
      <div className="mt-1 space-y-1">{children}</div>
    </details>
  );
}

type Partner = { email: string; you: boolean };

export function InterviewerMode({ c, candidates, me }: { c: CaseRecord; candidates: Partner[]; me: string }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [step, setStep] = useState(0);
  const [present, setPresent] = useState<Exhibit | null>(null);
  const [candidate, setCandidate] = useState(candidates.find((p) => !p.you)?.email ?? "");
  const hinted = (c.firm_style_hint ?? []).map((h) => h.toLowerCase()).find((h) => FIRM_MODES.some((f) => f.key === h)) as FirmMode | undefined;
  const [firm, setFirm] = useState<FirmMode>(hinted ?? "bain");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [wentWell, setWentWell] = useState("");
  const [workOn, setWorkOn] = useState("");
  const [hints, setHints] = useState(0);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  const mins = startedAt ? Math.floor((now - startedAt) / 60000) : 0;
  const secs = startedAt ? Math.floor(((now - startedAt) / 1000) % 60) : 0;

  const stages = [...c.stages].sort((a, b) => a.order - b.order);
  const ex = (id: string) => c.exhibits.find((e) => e.id === id);
  const others = candidates.filter((p) => !p.you);

  async function submit() {
    if (!candidate) return setStatus({ ok: false, text: "Pick who you interviewed." });
    if (DIMENSIONS.some((d) => !scores[d.key])) return setStatus({ ok: false, text: "Score all 7 areas (1-5)." });
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          candidate_email: candidate,
          case_id: c.id,
          firm_mode: firm,
          duration_min: startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 60000)) : null,
          hints_used: hints,
          scores,
          mistakes: mistakes.map((m) => ({ category: m })),
          went_well: wentWell,
          work_on: workOn,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Couldn't save");
      setStatus({ ok: true, text: `Sent to ${candidate}. They'll see it in their Journal and can add it to their log.` });
    } catch (e) {
      setStatus({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {present && <Present e={present} onClose={() => setPresent(null)} />}

      <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className={label}>You are the interviewer</p>
          <p className="text-sm text-ink-2">Keep this screen to yourself. Use &ldquo;Show&rdquo; to put an exhibit full-screen for the candidate.</p>
        </div>
        <div className="flex items-center gap-3">
          <span role="timer" className="text-2xl font-semibold tabular-nums">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</span>
          {!startedAt && <button type="button" onClick={() => { setStartedAt(Date.now()); setNow(Date.now()); }} className={`${btn} bg-accent text-accent-ink`}>Start</button>}
        </div>
      </section>

      <section className={card}>
        <p className={label}>1 · Read the prompt aloud</p>
        <p className="mt-1 whitespace-pre-line text-lg leading-snug">{c.prompt}</p>
        {c.clarifying_info.length > 0 && (
          <Key title={`Answers to clarifying questions (${c.clarifying_info.length}), only if asked`}>
            <dl className="space-y-1">{c.clarifying_info.map((q, i) => <div key={i}><dt className="font-medium">{q.question_topic}</dt><dd className="text-ink-2">{q.answer}</dd></div>)}</dl>
          </Key>
        )}
        <Key title="Expected structure">
          <p>{c.suggested_framework.summary}</p>
        </Key>
        <Key title="How to run this case">
          <p className="whitespace-pre-line">{c.interviewer_notes}</p>
        </Key>
      </section>

      <section aria-labelledby="h-stages" className="space-y-2">
        <h2 id="h-stages" className={label}>2 · Run the case, step by step</h2>
        <ol className="space-y-2">
          {stages.map((s, i) => (
            <li key={s.order} className={`${card} ${i === step ? "border-accent" : i < step ? "opacity-70" : ""}`}>
              <button type="button" onClick={() => setStep(i)} className="w-full text-left" aria-expanded={i === step}>
                <span className={label}>Step {i + 1} · {s.kind.replace("-", " ")}</span>
                <span className="mt-1 block font-medium">&ldquo;{s.interviewer_asks}&rdquo;</span>
              </button>
              {i === step && (
                <div className="mt-2 space-y-2 text-sm">
                  {s.release_when && <p><b>When:</b> {s.release_when}</p>}
                  {s.info_to_release && <p><b>Give them:</b> {s.info_to_release}</p>}
                  {(s.exhibit_ids ?? []).map((id) => {
                    const e = ex(id);
                    return e ? (
                      <div key={id} className="flex flex-wrap items-center gap-2">
                        <span>📊 {e.title}</span>
                        <button type="button" onClick={() => setPresent(e)} className="min-h-9 rounded-lg border border-line px-3 text-sm font-semibold">Show</button>
                      </div>
                    ) : null;
                  })}
                  <Key>
                    <p>{s.expected_answer}</p>
                    {s.good_answer_signals?.length ? <ul className="list-disc pl-5 text-ink-2">{s.good_answer_signals.map((g) => <li key={g}>{g}</li>)}</ul> : null}
                  </Key>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setHints((h) => h + 1)} className="min-h-9 rounded-lg border border-line px-3 text-sm">Gave a hint ({hints})</button>
                    {i + 1 < stages.length && <button type="button" onClick={() => setStep(i + 1)} className="min-h-9 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-ink">Next step</button>}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
        {c.exhibits.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-muted">All exhibits:</span>
            {c.exhibits.map((e) => <button key={e.id} type="button" onClick={() => setPresent(e)} className="underline">{e.title}</button>)}
          </div>
        )}
      </section>

      {c.math.length > 0 && (
        <section className={card}>
          <p className={label}>Math answer key</p>
          <ul className="mt-2 space-y-2 text-sm">
            {c.math.map((m) => (
              <li key={m.id}>
                <b>{m.question}</b> → {m.answer}
                <Key title="Worked steps"><ol className="list-decimal pl-5">{m.steps.map((x) => <li key={x}>{x}</li>)}</ol></Key>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <p className={label}>3 · Ask for the recommendation</p>
        <p className="mt-1">&ldquo;The CEO just walked in. What&apos;s your recommendation?&rdquo;</p>
        <Key title="Sample recommendation and what great looks like">
          <p>{c.synthesis}</p>
          <ul className="list-disc pl-5 text-ink-2">{c.what_great_looks_like.map((w) => <li key={w}>{w}</li>)}</ul>
        </Key>
      </section>

      <section className={`${card} space-y-4`} aria-labelledby="h-score">
        <h2 id="h-score" className="font-semibold">4 · Score the candidate</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium">Candidate</span>
            <select value={candidate} onChange={(e) => setCandidate(e.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-surface px-3">
              <option value="">Choose…</option>
              {others.map((p) => <option key={p.email} value={p.email}>{p.email}</option>)}
            </select>
            {others.length === 0 && <span className="mt-1 block text-xs text-muted">No one else is invited yet. Add casing partners in Settings.</span>}
          </label>
          <label className="text-sm">
            <span className="font-medium">Interview style</span>
            <select value={firm} onChange={(e) => setFirm(e.target.value as FirmMode)} className="mt-1 min-h-10 w-full rounded-lg border border-line bg-surface px-3">
              {FIRM_MODES.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Scores (1 = weak, 5 = offer-level)</legend>
          {DIMENSIONS.map((d) => (
            <div key={d.key} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm">{d.label}</span>
              <div className="flex gap-1" role="radiogroup" aria-label={d.label}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={scores[d.key] === n} onClick={() => setScores({ ...scores, [d.key]: n })}
                    className={`h-10 w-10 rounded-lg border text-sm font-semibold tabular-nums ${scores[d.key] === n ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium">Mistakes you noticed</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {MISTAKE_CATEGORIES.map((m) => {
              const on = mistakes.includes(m.key);
              return <button key={m.key} type="button" aria-pressed={on} onClick={() => setMistakes(on ? mistakes.filter((x) => x !== m.key) : [...mistakes, m.key])}
                className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-warn bg-warn text-white" : "border-line"}`}>{m.label}</button>;
            })}
          </div>
        </fieldset>
        <label className="block text-sm"><span className="font-medium">What went well</span>
          <textarea rows={2} value={wentWell} onChange={(e) => setWentWell(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg p-3 text-base" /></label>
        <label className="block text-sm"><span className="font-medium">Biggest thing to work on</span>
          <textarea rows={2} value={workOn} onChange={(e) => setWorkOn(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-bg p-3 text-base" /></label>
        <button type="button" onClick={submit} disabled={busy || !others.length} className={`${btn} bg-accent text-accent-ink disabled:opacity-50`}>{busy ? "Sending…" : "Send scorecard"}</button>
        {status && <p role="status" className={`text-sm ${status.ok ? "text-ok" : "text-warn"}`}>{status.text}</p>}
        <p className="text-xs text-muted">Signed in as {me}. The scorecard goes only to the candidate you pick; they choose whether to add it to their journal.</p>
      </section>
      <Link href={`/case/${c.id}`} className="text-sm underline">Case page</Link>
    </div>
  );
}
