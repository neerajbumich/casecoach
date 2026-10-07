"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GRADES, isDue, queue, review, type Grade } from "@/lib/srs";
import type { DrillResult, SrsState } from "@/lib/training-types";
import { newKey, useItems } from "@/components/useItems";

type Card = { id: string; deck: string; front: string; back: string; link?: string };
type Deck = { id: string; title: string; blurb: string };
const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";

export function Flashcards({ cards, decks }: { cards: Card[]; decks: Deck[] }) {
  const srs = useItems<SrsState>("srs");
  const drills = useItems<DrillResult>("drill");
  const [chosen, setChosen] = useState<string[]>(decks.map((d) => d.id));
  const [session, setSession] = useState<Card[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<{ reviewed: number; good: number }>({ reviewed: 0, good: 0 });

  const state = useMemo(() => new Map((srs.items ?? []).map((i) => [i.key, i.data])), [srs.items]);
  const stats = useMemo(() => {
    const now = Date.now();
    return decks.map((d) => {
      const cs = cards.filter((c) => c.deck === d.id);
      const seen = cs.filter((c) => state.has(c.id));
      return { ...d, total: cs.length, seen: seen.length, due: seen.filter((c) => isDue(state.get(c.id), now)).length, mastered: seen.filter((c) => (state.get(c.id)?.interval ?? 0) >= 21).length };
    });
  }, [cards, decks, state]);

  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " && !flipped) { e.preventDefault(); setFlipped(true); }
      if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade((Number(e.key) - 1) as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function start() {
    const pool = cards.filter((c) => chosen.includes(c.deck));
    const q = queue(pool, state, 15).slice(0, 40);
    setSession(q);
    setPos(0);
    setFlipped(false);
    setDone({ reviewed: 0, good: 0 });
  }
  function grade(g: Grade) {
    if (!session) return;
    const c = session[pos];
    const next = review(state.get(c.id), g);
    srs.put(c.id, next);
    const d = { reviewed: done.reviewed + 1, good: done.good + (g >= 2 ? 1 : 0) };
    setDone(d);
    // "Again" puts the card back at the end of this session.
    const s = g === 0 ? [...session, c] : session;
    setSession(s);
    setFlipped(false);
    if (pos + 1 >= s.length) {
      drills.put(newKey(), { drill: "flashcards", at: new Date().toISOString(), score: d.good / d.reviewed, n: d.reviewed, correct: d.good });
    }
    setPos(pos + 1);
  }

  if (srs.items === null) return <p className="text-sm text-muted">Loading your cards…</p>;

  if (!session)
    return (
      <div className="space-y-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {stats.map((d) => {
            const on = chosen.includes(d.id);
            return (
              <li key={d.id}>
                <label className={`flex h-full cursor-pointer gap-3 rounded-xl border p-4 ${on ? "border-accent bg-surface" : "border-line bg-surface"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={on} onChange={() => setChosen(on ? chosen.filter((x) => x !== d.id) : [...chosen, d.id])} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{d.title}</span>
                    <span className="block text-sm text-ink-2">{d.blurb}</span>
                    <span className="mt-1 block text-xs tabular-nums text-muted">{d.total} cards · {d.seen} seen · {d.due} due · {d.mastered} mastered</span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={start} disabled={!chosen.length} className={`${btn} bg-accent text-accent-ink`}>
          Study ({stats.filter((d) => chosen.includes(d.id)).reduce((s, d) => s + d.due, 0)} due + up to 15 new)
        </button>
        <p className="text-xs text-muted">Cards you know come back less often; ones you miss come back sooner. &ldquo;Mastered&rdquo; means an interval of 3+ weeks. Progress syncs across your devices.</p>
        {srs.error && <p role="alert" className="text-sm text-warn">{srs.error}</p>}
      </div>
    );

  if (pos >= session.length)
    return (
      <section className={`${card} space-y-3 text-center`}>
        <p className="text-3xl font-semibold tabular-nums">{done.reviewed ? Math.round((done.good / done.reviewed) * 100) : 0}%</p>
        <p className="text-sm text-ink-2">{done.reviewed} reviews · {done.good} good or easy. Come back tomorrow for the next batch.</p>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={() => setSession(null)} className={`${btn} border border-line`}>Decks</button>
          <button type="button" onClick={start} className={`${btn} bg-accent text-accent-ink`}>Keep going</button>
        </div>
      </section>
    );

  const c = session[pos];
  const deck = decks.find((d) => d.id === c.deck)?.title;
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm tabular-nums text-muted">
        <span>{deck}</span>
        <span>{pos + 1} / {session.length}</span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped(true)}
        aria-label={flipped ? "Answer shown" : "Show answer"}
        className={`${card} flex min-h-56 w-full flex-col justify-center gap-4 text-left`}
      >
        <span className="text-lg font-semibold leading-snug">{c.front}</span>
        {flipped ? (
          <span className="border-t border-line pt-4 leading-relaxed" aria-live="polite">{c.back}</span>
        ) : (
          <span className="text-sm text-muted">Say the answer out loud, then tap (or press space) to check.</span>
        )}
      </button>
      {flipped && (
        <>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="How well did you know it?">
            {GRADES.map(({ g, label }) => (
              <button key={g} type="button" onClick={() => grade(g)} className={`${btn} ${g === 0 ? "border border-warn text-warn" : g === 2 ? "bg-accent text-accent-ink" : "border border-line"}`}>
                {label}
              </button>
            ))}
          </div>
          {c.link && <Link href={c.link} className="block text-center text-sm underline">Open the full page</Link>}
        </>
      )}
    </div>
  );
}
