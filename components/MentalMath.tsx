"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { TYPES, fmt, isCorrect, makeSet, type MathType, type Problem } from "@/lib/mental-math";
import { newKey, useItems } from "@/components/useItems";
import type { DrillResult } from "@/lib/training-types";


type Answer = { p: Problem; given: string; ok: boolean; sec: number };
const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";

export function MentalMath() {
  const { items, put, error } = useItems<DrillResult>("drill");
  const [types, setTypes] = useState<MathType[]>(TYPES.map((t) => t.key));
  const [len, setLen] = useState(15);
  const [set, setSet] = useState<Problem[] | null>(null);
  const [i, setI] = useState(0);
  const [given, setGiven] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Answer | null>(null);
  const shownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!set || feedback || i >= set.length) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [set, feedback, i]);
  useEffect(() => {
    if (set && !feedback) {
      shownAt.current = Date.now();
      setNow(Date.now());
      inputRef.current?.focus();
    }
  }, [set, i, feedback]);

  const history = useMemo(() => (items ?? []).filter((d) => d.data.drill === "math").sort((a, b) => a.data.at.localeCompare(b.data.at)), [items]);
  const weakest = useMemo(() => {
    const agg: Record<string, { n: number; correct: number }> = {};
    for (const h of history.slice(-10)) for (const [k, v] of Object.entries(h.data.by_type ?? {})) {
      agg[k] ??= { n: 0, correct: 0 };
      agg[k].n += v.n;
      agg[k].correct += v.correct;
    }
    return Object.entries(agg).filter(([, v]) => v.n >= 3).sort((a, b) => a[1].correct / a[1].n - b[1].correct / b[1].n).slice(0, 2).map(([k]) => k as MathType);
  }, [history]);

  function start(ts = types) {
    setSet(makeSet(ts.length ? ts : TYPES.map((t) => t.key), len));
    setI(0);
    setAnswers([]);
    setFeedback(null);
    setGiven("");
  }
  function submit(skip = false) {
    if (!set) return;
    const p = set[i];
    const a: Answer = { p, given: skip ? "" : given, ok: !skip && isCorrect(p, given), sec: Math.round((Date.now() - shownAt.current) / 100) / 10 };
    setAnswers((xs) => [...xs, a]);
    setGiven("");
    if (a.ok) next([...answers, a]);
    else setFeedback(a);
  }
  function next(all = answers) {
    setFeedback(null);
    if (!set) return;
    if (i + 1 < set.length) return setI(i + 1);
    setI(set.length);
    const by: DrillResult["by_type"] = {};
    for (const a of all) {
      by[a.p.type] ??= { n: 0, correct: 0, sec: 0 };
      by[a.p.type].n++;
      by[a.p.type].correct += a.ok ? 1 : 0;
      by[a.p.type].sec += a.sec;
    }
    const correct = all.filter((a) => a.ok).length;
    put(newKey(), { drill: "math", at: new Date().toISOString(), score: correct / all.length, n: all.length, correct, avg_sec: Math.round((all.reduce((s, a) => s + a.sec, 0) / all.length) * 10) / 10, by_type: by });
  }

  if (!set)
    return (
      <div className="space-y-4">
        <section className={`${card} space-y-3`}>
          <fieldset>
            <legend className="font-semibold">Problem types</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => {
                const on = types.includes(t.key);
                return (
                  <button key={t.key} type="button" aria-pressed={on} onClick={() => setTypes(on ? types.filter((x) => x !== t.key) : [...types, t.key])}
                    className={`min-h-9 rounded-full border px-3 text-sm ${on ? "border-accent bg-accent text-accent-ink" : "border-line"}`}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-sm">
            Questions
            <select value={len} onChange={(e) => setLen(Number(e.target.value))} className="min-h-10 rounded-lg border border-line bg-surface px-3">
              {[10, 15, 20, 30].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => start()} className={`${btn} bg-accent text-accent-ink`} disabled={!types.length}>Start</button>
            {weakest.length > 0 && (
              <button type="button" onClick={() => start(weakest)} className={`${btn} border border-line`}>
                Focus on my weakest: {weakest.map((w) => TYPES.find((t) => t.key === w)?.label).join(" + ")}
              </button>
            )}
          </div>
          <p className="text-xs text-muted">Type answers like 1,200 · 1.2k · $4.5M · 12.5%. Rounded answers within about 1–2% count for percentages and big numbers.</p>
        </section>
        {history.length > 0 && (
          <section className={card} aria-labelledby="h-hist">
            <h2 id="h-hist" className="font-semibold">Your last runs</h2>
            <ul className="mt-2 space-y-1 text-sm tabular-nums">
              {history.slice(-5).reverse().map((h) => (
                <li key={h.key} className="flex justify-between gap-2">
                  <span>{new Date(h.data.at).toLocaleDateString()}</span>
                  <span>{h.data.correct}/{h.data.n} correct · {h.data.avg_sec}s avg</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {error && <p role="alert" className="text-sm text-warn">{error}</p>}
      </div>
    );

  if (i >= set.length) {
    const correct = answers.filter((a) => a.ok).length;
    const avg = answers.reduce((s, a) => s + a.sec, 0) / answers.length;
    return (
      <div className="space-y-4">
        <section className={`${card} text-center`}>
          <p className="text-4xl font-semibold tabular-nums">{correct}/{answers.length}</p>
          <p className="text-sm text-ink-2">{avg.toFixed(1)}s average per question</p>
        </section>
        <section className={card} aria-labelledby="h-rev">
          <h2 id="h-rev" className="font-semibold">Review</h2>
          <ul className="mt-2 divide-y divide-line text-sm">
            {answers.map((a) => (
              <li key={a.p.id} className="flex items-start justify-between gap-3 py-2">
                <span>
                  <span aria-hidden className={a.ok ? "text-ok" : "text-warn"}>{a.ok ? "✓ " : "✕ "}</span>
                  {a.p.prompt}
                  {!a.ok && <span className="block text-xs text-muted">You: {a.given || "skipped"} · Answer: {fmt(a.p.answer, a.p.unit)}</span>}
                </span>
                <span className="tabular-nums text-muted">{a.sec}s</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex gap-2">
          <button type="button" onClick={() => start()} className={`${btn} bg-accent text-accent-ink`}>Again</button>
          <button type="button" onClick={() => setSet(null)} className={`${btn} border border-line`}>Change settings</button>
        </div>
      </div>
    );
  }

  const p = set[i];
  const elapsed = Math.max(0, Math.round((now - shownAt.current) / 1000));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted tabular-nums">
        <span>{i + 1} / {set.length} · {TYPES.find((t) => t.key === p.type)?.label}</span>
        <span>{elapsed}s</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${(i / set.length) * 100}%` }} /></div>
      <section className={`${card} space-y-4`}>
        <p className="text-xl font-semibold leading-snug" aria-live="polite">{p.prompt}</p>
        {feedback ? (
          <div role="alert" className="space-y-2">
            <p className="text-warn">Not quite: you said {feedback.given || "nothing"}.</p>
            <p>Answer: <b className="tabular-nums">{fmt(p.answer, p.unit)}</b></p>
            <p className="text-sm text-ink-2">Tip: {p.hint}</p>
            <button type="button" onClick={() => next()} className={`${btn} bg-accent text-accent-ink`} autoFocus>Next</button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (given.trim()) submit(); }} className="flex gap-2">
            <label htmlFor="ans" className="sr-only">Your answer</label>
            <input id="ans" ref={inputRef} inputMode="decimal" autoComplete="off" value={given} onChange={(e) => setGiven(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-lg tabular-nums" placeholder="Answer" />
            <button type="submit" className={`${btn} bg-accent text-accent-ink`}>Check</button>
            <button type="button" onClick={() => submit(true)} className={`${btn} border border-line`}>Skip</button>
          </form>
        )}
      </section>
    </div>
  );
}
