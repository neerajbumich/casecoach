"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { CaseIndexEntry } from "@/lib/cases";
import { CASE_TYPES, label } from "@/lib/taxonomy";
import { FIRM_MODES, type FirmMode } from "@/lib/scoring";
import { useProgress } from "@/components/useProgress";

type Recent = { id: string; title: string; overall: number | null; at: string; firm: string };
type Rec = { id: string; title: string; label: string; avg: number; why: string } | null;

export function practiceUrl(id: string, o: { firm: FirmMode; fit: boolean; minutes: number; voice: boolean }) {
  return `/practice/${id}?firm=${o.firm}&fit=${o.fit ? 1 : 0}&min=${o.minutes}&voice=${o.voice ? 1 : 0}`;
}

const sel = "min-h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm";

export function PracticeHub({ index, recent, recommendation, llmEnabled, initialFirm, due }: { index: CaseIndexEntry[]; recent: Recent[]; recommendation: Rec; llmEnabled: boolean; initialFirm?: FirmMode; due?: number }) {
  const router = useRouter();
  const { isSolved } = useProgress();
  const [firm, setFirm] = useState<FirmMode>(initialFirm ?? "bain");
  const [fit, setFit] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [voice, setVoice] = useState(true);
  const [type, setType] = useState("");
  const [industry, setIndustry] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [format, setFormat] = useState("");
  const [pick, setPick] = useState("");
  const opts = { firm, fit, minutes, voice };

  const pool = useMemo(
    () =>
      index.filter(
        (c) =>
          (!type || c.case_type.includes(type)) &&
          (!industry || c.industry === industry) &&
          (!difficulty || String(c.difficulty) === difficulty) &&
          (!format || c.format === format),
      ),
    [index, type, industry, difficulty, format],
  );
  const unsolved = pool.filter((c) => !isSolved(c.id));
  const industries = [...new Set(index.map((c) => c.industry))].sort();

  const random = () => {
    const from = unsolved.length ? unsolved : pool;
    if (!from.length) return;
    router.push(practiceUrl(from[Math.floor(Math.random() * from.length)].id, opts));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-muted">Mock cases with Claude or a casing partner, plus short drills for the skills underneath.</p>
      </div>

      <nav aria-label="Drills" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          { href: "/practice/math", t: "Mental math", n: "Timed case arithmetic" },
          { href: "/practice/sizing", t: "Market sizing", n: "30 problems with model answers" },
          { href: "/practice/cards", t: "Flashcards", n: due ? `${due} due today` : "Spaced repetition" },
          { href: "/practice/fit", t: "Fit stories", n: "Story bank + question drill" },
          { href: "/communication", t: "Communication", n: "Structure, exhibit, 60-sec drills" },
          { href: "/practice/partner", t: "Casing partner", n: "Interview a friend, trade scorecards" },
        ].map((d) => (
          <Link key={d.href} href={d.href} className="rounded-xl border border-line bg-surface p-3 hover:bg-surface-2">
            <span className="block text-sm font-semibold">{d.t}</span>
            <span className="block text-xs text-muted">{d.n}</span>
          </Link>
        ))}
      </nav>

      <h2 className="pt-2 font-semibold">Mock case interview</h2>

      {recommendation && (
        <Link href={practiceUrl(recommendation.id, opts)} className="block rounded-xl border border-accent/40 bg-surface p-4 hover:bg-surface-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Targets your weakest area · {recommendation.label} (avg {recommendation.avg}/5)</p>
          <p className="mt-1 font-semibold">{recommendation.title}</p>
          <p className="text-sm text-ink-2">{recommendation.why}</p>
        </Link>
      )}

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4" aria-labelledby="h-mode">
        <h2 id="h-mode" className="font-semibold">Interview style</h2>
        <div role="radiogroup" aria-label="Firm style" className="grid gap-2 sm:grid-cols-2">
          {FIRM_MODES.map((f) => (
            <button
              key={f.key}
              role="radio"
              aria-checked={firm === f.key}
              onClick={() => setFirm(f.key)}
              className={`min-h-11 rounded-lg border px-3 text-left text-sm ${firm === f.key ? "border-accent bg-accent text-accent-ink" : "border-line"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="h-4 w-4" /> I&apos;ll use voice
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={fit} onChange={(e) => setFit(e.target.checked)} className="h-4 w-4" />
            Start with a fit{firm === "mckinsey" ? " / PEI" : ""} question
          </label>
          <label className="flex min-h-10 items-center gap-2">
            Length
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="min-h-9 rounded-lg border border-line bg-surface px-2">
              {[20, 25, 30, 35, 40].map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-surface p-4" aria-labelledby="h-random">
        <h2 id="h-random" className="font-semibold">Random case</h2>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted">Type
            <select className={sel} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Any</option>
              {CASE_TYPES.filter((t) => index.some((c) => c.case_type.includes(t))).map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Industry
            <select className={sel} value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Any</option>
              {industries.map((i) => <option key={i} value={i}>{label(i)}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Difficulty
            <select className={sel} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Any</option>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}/5</option>)}
            </select>
          </label>
          <label className="text-xs text-muted">Book format
            <select className={sel} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="">Any</option>
              <option value="candidate-led">Candidate-led</option>
              <option value="interviewer-led">Interviewer-led</option>
            </select>
          </label>
        </div>
        <button onClick={random} disabled={!pool.length} className="min-h-11 w-full rounded-lg bg-accent font-semibold text-accent-ink disabled:opacity-50">
          {pool.length ? `Surprise me (${unsolved.length} unsolved of ${pool.length})` : "No cases match"}
        </button>
      </section>

      <section className="space-y-2 rounded-xl border border-line bg-surface p-4" aria-labelledby="h-pick">
        <h2 id="h-pick" className="font-semibold">Pick a specific case</h2>
        <div className="flex gap-2">
          <label htmlFor="pick" className="sr-only">Case</label>
          <select id="pick" className={sel} value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Choose a case…</option>
            {[...index].sort((a, b) => a.title.localeCompare(b.title)).map((c) => (
              <option key={c.id} value={c.id}>{c.title} · {c.school} {c.year}{isSolved(c.id) ? " ✓" : ""}</option>
            ))}
          </select>
          <button disabled={!pick} onClick={() => router.push(practiceUrl(pick, opts))} className="min-h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50">Start</button>
        </div>
        <p className="text-xs text-muted">Or open any case in the Library and tap &quot;Practice this case&quot;.</p>
      </section>

      <p className="text-xs text-muted">
        {llmEnabled ? "The in-app AI interviewer is on (see the case page)." : "The in-app AI interviewer is off. It needs an Anthropic API key and a monthly spend cap. Practising with the Claude app costs nothing extra."}
      </p>

      {recent.length > 0 && (
        <section aria-labelledby="h-recent">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 id="h-recent" className="text-sm font-semibold">Recent sessions</h2>
            <Link href="/sessions" className="text-sm underline underline-offset-2">All sessions</Link>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            {recent.map((r) => (
              <li key={r.id}>
                <Link href={`/sessions/${r.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface-2">
                  <span>
                    <span className="block font-medium">{r.title}</span>
                    <span className="text-xs text-muted">{new Date(r.at).toLocaleDateString()} · {FIRM_MODES.find((f) => f.key === r.firm)?.label.split(" ")[0]}</span>
                  </span>
                  <span className="text-lg font-semibold tabular-nums">{r.overall ?? "–"}<span className="text-xs text-muted">/5</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
