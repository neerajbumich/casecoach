"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FrameworkTree } from "@/components/FrameworkTree";
import type { DrillItem } from "@/lib/drills";
import { newKey, useItems } from "@/components/useItems";
import type { DrillResult } from "@/lib/training-types";

type Cfg = { title: string; prepSec: number; speakSec: number; checklist: string[] };
type Phase = "prep" | "speak" | "review";

const card = "rounded-xl border border-line bg-surface p-4";
const btn = "min-h-11 rounded-lg px-4 text-sm font-semibold";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  return left;
}

function Clock({ left, total, label }: { left: number; total: number; label: string }) {
  const over = left < 0;
  const abs = Math.abs(left);
  const text = `${over ? "+" : ""}${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, "0")}`;
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  return (
    <div className="space-y-1" aria-live="off">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
        <span className={`text-2xl font-semibold tabular-nums ${over ? "text-warn" : ""}`} role="timer" aria-label={`${label}: ${text}`}>{text}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Material({ item }: { item: DrillItem }) {
  if (item.kind === "structure")
    return (
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Case prompt · {item.title}</p>
        <p className="mt-1 whitespace-pre-line">{item.prompt}</p>
        {item.clarifying.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">Answers to clarifying questions ({item.clarifying.length})</summary>
            <dl className="mt-2 space-y-1">
              {item.clarifying.map((c, i) => (
                <div key={i}>
                  <dt className="font-medium">{c.q}</dt>
                  <dd className="text-ink-2">{c.a}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    );
  if (item.kind === "exhibit")
    return (
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Case · {item.title}</p>
        <p className="mt-1 text-sm text-ink-2">{item.question}</p>
        <p className="mt-3 font-semibold">{item.exhibit.title}</p>
        {item.exhibit.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.exhibit.image} alt={`Exhibit: ${item.exhibit.title}`} className="mt-2 h-auto w-full rounded-md border border-line bg-white" />
        )}
        {item.exhibit.table && (
          <div className="mt-2 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>{item.exhibit.table.columns.map((c) => <th key={c} className="border-b border-line px-2 py-1 text-left font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {item.exhibit.table.rows.map((r, i) => (
                  <tr key={i}>{r.map((v, j) => <td key={j} className="border-b border-line px-2 py-1 tabular-nums">{String(v)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  return (
    <div className={card}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Case · {item.title}</p>
      <p className="mt-1 text-sm text-ink-2">{item.prompt}</p>
      <p className="mt-3 font-semibold">What you found during the case</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
        {item.findings.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
  );
}

function Model({ item }: { item: DrillItem }) {
  if (item.kind === "structure")
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink-2">{item.model.summary}</p>
        <FrameworkTree tree={item.model.tree} />
        {item.frameworks.length > 0 && (
          <p className="text-sm">
            <span className="text-muted">Related frameworks: </span>
            {item.frameworks.map((f, i) => (
              <span key={f.id}>{i > 0 && ", "}<Link href={`/frameworks/${f.id}`} className="underline">{f.name}</Link></span>
            ))}
          </p>
        )}
      </div>
    );
  if (item.kind === "exhibit") return <p>{item.insight}</p>;
  return <p className="whitespace-pre-line">{item.model}</p>;
}

function feedbackPrompt(item: DrillItem, cfg: Cfg, answer: string) {
  const context =
    item.kind === "structure"
      ? `Case prompt:\n${item.prompt}\n\nCasebook's suggested structure (reference only, don't expect a copy):\n${item.model.summary}`
      : item.kind === "exhibit"
        ? `Case: ${item.question}\nExhibit: ${item.exhibit.title}\nKey insight the casebook expects: ${item.insight}`
        : `Case prompt:\n${item.prompt}\n\nFindings:\n${item.findings.map((f) => `- ${f}`).join("\n")}\n\nCasebook's recommendation (reference):\n${item.model}`;
  return [
    `You are an MBB interviewer coaching an MBA candidate on communication. Drill: ${cfg.title}.`,
    context,
    `My answer (spoken, transcribed):\n${answer.trim() || "(I answered out loud and didn't type it. Ask me to repeat it.)"}`,
    `Grade me 1-5 on each item: ${cfg.checklist.join("; ")}. Then give the 2 most important fixes, and a rewritten version I could say out loud in the same time limit. Be direct and concise.`,
  ].join("\n\n");
}

export function CommDrill({ item, cfg, nextHref }: { item: DrillItem; cfg: Cfg; nextHref: string }) {
  const [phase, setPhase] = useState<Phase>("prep");
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<boolean[]>(() => cfg.checklist.map(() => false));
  const [status, setStatus] = useState<string | null>(null);
  const prepLeft = useCountdown(cfg.prepSec, phase === "prep");
  const speakLeft = useCountdown(cfg.speakSec, phase === "speak");
  const speakStarted = useRef<number | null>(null);
  const [used, setUsed] = useState<number | null>(null);
  const drills = useItems<DrillResult>("drill");
  const [saved, setSaved] = useState(false);

  function startSpeaking() {
    speakStarted.current = Date.now();
    setPhase("speak");
  }
  function finish() {
    if (speakStarted.current) setUsed(Math.round((Date.now() - speakStarted.current) / 1000));
    setPhase("review");
  }
  const score = checked.filter(Boolean).length;
  function save() {
    if (saved) return;
    setSaved(true);
    drills.put(newKey(), { drill: item.kind, at: new Date().toISOString(), score: score / cfg.checklist.length, n: cfg.checklist.length, correct: score, avg_sec: used ?? undefined, ref: item.caseId, label: item.title });
  }

  return (
    <div className="space-y-4">
      <Material item={item} />

      {phase === "prep" && (
        <div className={`${card} space-y-3`}>
          <Clock left={prepLeft} total={cfg.prepSec} label="Think time" />
          <p className="text-sm text-ink-2">Jot notes on paper. When you&apos;re ready, start the clock and say your answer out loud, as if the interviewer were in front of you.</p>
          <button type="button" onClick={startSpeaking} className={`${btn} bg-accent text-accent-ink`}>Start speaking</button>
        </div>
      )}

      {phase === "speak" && (
        <div className={`${card} space-y-3`}>
          <Clock left={speakLeft} total={cfg.speakSec} label="Speaking time" />
          <label htmlFor="ans" className="block text-sm text-ink-2">
            Speak out loud. Optionally type or dictate it here (on iPhone, tap the microphone on the keyboard) so you can review it and get feedback.
          </label>
          <textarea id="ans" rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full rounded-lg border border-line bg-bg p-3 text-base" />
          <button type="button" onClick={finish} className={`${btn} bg-accent text-accent-ink`}>Done</button>
        </div>
      )}

      {phase === "review" && (
        <>
          <section aria-labelledby="h-self" className={`${card} space-y-2`}>
            <div className="flex items-baseline justify-between">
              <h2 id="h-self" className="font-semibold">Score yourself</h2>
              <span className="text-sm tabular-nums text-muted">
                {score}/{cfg.checklist.length}
                {used !== null && ` · ${used}s of ${cfg.speakSec}s`}
              </span>
            </div>
            <ul className="space-y-1">
              {cfg.checklist.map((c, i) => (
                <li key={c}>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={checked[i]} onChange={(e) => setChecked((xs) => xs.map((x, j) => (j === i ? e.target.checked : x)))} />
                    {c}
                  </label>
                </li>
              ))}
            </ul>
            {answer.trim() && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">What you said</summary>
                <p className="mt-1 whitespace-pre-line text-ink-2">{answer}</p>
              </details>
            )}
          </section>

          <section aria-labelledby="h-model" className={`${card} space-y-2`}>
            <h2 id="h-model" className="font-semibold">{item.kind === "exhibit" ? "The key insight" : "The casebook's version"}</h2>
            <Model item={item} />
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${btn} border border-line bg-surface`}
              onClick={async () => setStatus((await copy(feedbackPrompt(item, cfg, answer))) ? "✓ Copied. Paste it into the Claude app for detailed feedback." : "Couldn't copy.")}
            >
              Copy feedback prompt for Claude app
            </button>
            <Link href={nextHref} onClick={save} className={`${btn} inline-flex items-center bg-accent text-accent-ink`}>Save & next</Link>
            <button type="button" onClick={save} disabled={saved} className={`${btn} border border-line disabled:opacity-60`}>{saved ? "✓ Saved" : "Save score"}</button>
            <Link prefetch={false} href={`/case/${item.caseId}`} className={`${btn} inline-flex items-center text-ink-2 underline`}>Open the case</Link>
          </div>
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-ink-2">{status}</p>
        </>
      )}
    </div>
  );
}
